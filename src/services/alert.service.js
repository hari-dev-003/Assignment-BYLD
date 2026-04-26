import { Decimal } from 'decimal.js';
import prisma from '../config/db.js';

export const alertService = {
  async createAlert(portfolioId, { symbol, kind, price, webhookUrl }) {
    const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

    const company = await prisma.company.findUnique({ where: { symbol } });
    if (!company) throw new Error('COMPANY_NOT_FOUND');

    return await prisma.alert.create({
      data: { portfolioId, symbol, kind, price, webhookUrl },
    });
  },

  async evaluateAlerts() {
    // 1. Fetch all ACTIVE alerts
    const activeAlerts = await prisma.alert.findMany({ where: { status: 'ACTIVE' } });
    if (activeAlerts.length === 0) return;

    // 2. Fetch current prices for every unique symbol in one query
    const symbols = [...new Set(activeAlerts.map((a) => a.symbol))];
    const companies = await prisma.company.findMany({
      where: { symbol: { in: symbols } },
      select: { symbol: true, price: true },
    });

    const priceMap = new Map(
      companies.map((c) => [c.symbol, new Decimal(c.price.toString())])
    );

    // 3. Evaluate each alert with Decimal.js — no floating-point errors
    const firedAlerts = activeAlerts.filter((alert) => {
      const currentPrice = priceMap.get(alert.symbol);
      if (!currentPrice) return false;
      const alertPrice = new Decimal(alert.price.toString());
      return alert.kind === 'ABOVE'
        ? currentPrice.gt(alertPrice)
        : currentPrice.lt(alertPrice);
    });

    if (firedAlerts.length === 0) return;

    // 4. Mark fired alerts INACTIVE BEFORE sending webhooks — prevents double-fire
    //    if a webhook call hangs past the next 30s tick
    await prisma.alert.updateMany({
      where: { id: { in: firedAlerts.map((a) => a.id) } },
      data: { status: 'INACTIVE' },
    });

    // 5. Send webhooks — fire-and-forget, errors are isolated per alert
    for (const alert of firedAlerts) {
      const currentPrice = priceMap.get(alert.symbol);
      const payload = {
        alertId:            alert.id,
        portfolioId:        alert.portfolioId,
        symbol:             alert.symbol,
        kind:               alert.kind,
        alertPrice:         alert.price.toString(),
        currentMarketPrice: currentPrice.toString(),
        firedAt:            new Date().toISOString(),
      };

      fetch(alert.webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }).catch((err) => {
        console.error(`[AlertPoller] Webhook delivery failed for alert ${alert.id}: ${err.message}`);
      });
    }

    console.log(`[AlertPoller] Fired ${firedAlerts.length} alert(s):`, firedAlerts.map((a) => a.id));
  },
};

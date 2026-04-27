# Variant C — Price Alerts & Webhook Testing

## How Alerts Work

1. Create an alert via `POST /v1/portfolios/:id/alerts`
2. A background job polls the `Company` table every **30 seconds**
3. If the condition is met (`ABOVE` / `BELOW`), the alert fires **once**, POSTs to the configured `webhookUrl`, then becomes `INACTIVE`

The alert is marked `INACTIVE` **before** the webhook POST — so a failed delivery does not cause a re-fire.

---

## Testing with webhook.site

1. Go to [https://webhook.site](https://webhook.site) — your unique URL is shown immediately (no signup needed)
2. Copy the URL (looks like `https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Create an alert that fires immediately — RELIANCE market price is `2950.45`, so set threshold above it:

```bash
curl -X POST http://localhost:3000/v1/portfolios/{portfolioId}/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "kind": "BELOW",
    "price": 5000.00,
    "webhookUrl": "https://webhook.site/your-unique-id"
  }'
```

4. Within 30 seconds, webhook.site shows an incoming POST with this payload:

```json
{
  "alertId": "uuid",
  "portfolioId": "uuid",
  "symbol": "RELIANCE",
  "kind": "BELOW",
  "alertPrice": "5000",
  "currentMarketPrice": "2950.45",
  "firedAt": "2026-04-26T12:00:00.000Z"
}
```

5. The alert status is now `INACTIVE` — it will not fire again.

---

## Seeded Company Prices (for alert testing)

| Symbol | Price | Quick trigger |
|---|---|---|
| `RELIANCE` | 2950.45 | `BELOW 5000` fires immediately |
| `TCS` | 3820.15 | `ABOVE 3000` fires immediately |
| `NIFTYBEES` | 245.12 | `ABOVE 200` fires immediately |
| `GS2033` | 100.25 | `BELOW 500` fires immediately |

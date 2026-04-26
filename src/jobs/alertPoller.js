import { alertService } from '../services/alert.service.js';

const POLL_INTERVAL_MS = 30_000;

export function startAlertPoller() {
  const tick = async () => {
    try {
      await alertService.evaluateAlerts();
    } catch (err) {
      // Log but never let an error kill the interval
      console.error('[AlertPoller] Evaluation error:', err.message);
    }
  };

  // Run one immediate tick so alerts are checked on server start, not after first 30s wait
  tick();
  setInterval(tick, POLL_INTERVAL_MS);

  console.log('[AlertPoller] Started — polling every 30 seconds');
}

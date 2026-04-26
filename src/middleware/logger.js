import { randomUUID } from 'node:crypto';

const logger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();

  req.requestId = requestId;

  res.setHeader('X-Request-Id', requestId);

  console.log(`[${requestId}] ${req.method} ${req.url}`);

  next();
};

export { logger };

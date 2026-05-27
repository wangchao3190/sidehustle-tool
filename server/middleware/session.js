const { v4: uuidv4 } = require('uuid');

function sessionMiddleware(req, res, next) {
  // Accept sessionId from body, query params, or header
  let sessionId = null;

  if (req.body && req.body.sessionId) {
    sessionId = req.body.sessionId;
  } else if (req.query && req.query.sessionId) {
    sessionId = req.query.sessionId;
  } else if (req.headers['x-session-id']) {
    sessionId = req.headers['x-session-id'];
  }

  // If no sessionId provided, generate one
  if (!sessionId) {
    sessionId = uuidv4();
    res.setHeader('X-Session-Id', sessionId);
    res.setHeader('Access-Control-Expose-Headers', 'X-Session-Id');
  }

  req.sessionId = sessionId;
  next();
}

module.exports = sessionMiddleware;

/* ═══════════════════════════════════════════════
   MIDDLEWARE/AUTH.JS — JWT Verification Middleware
   ═══════════════════════════════════════════════

   Usage:
     const { verifyToken } = require('./middleware/auth');
     app.get('/protected-route', verifyToken, handler);

   Reads:  Authorization: Bearer <token>
   Sets:   req.user = { id, name, email, mobile, iat, exp }
   ═══════════════════════════════════════════════ */

const jwt = require('jsonwebtoken');

/**
 * Express middleware that verifies the JWT sent in the
 * Authorization header.
 *
 * On success  → calls next()  (req.user is populated)
 * On missing  → 401 Unauthorized
 * On invalid  → 403 Forbidden
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Expect header in the form: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. No token provided. Please log in.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request object
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Session expired. Please log in again.'
      });
    }
    return res.status(403).json({
      error: 'Invalid token. Please log in again.'
    });
  }
};

module.exports = { verifyToken };

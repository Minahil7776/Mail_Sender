const jwt = require('jsonwebtoken');
const { User } = require('./models');
exports.sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
exports.auth = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const u = await User.findById(jwt.verify(t, process.env.JWT_SECRET).id);
    if (!u || !u.active) return res.status(401).json({ error: 'Unauthorized' });
    req.user = u; next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};
exports.admin = (req, res, next) =>
  req.user.role === 'superadmin' ? next() : res.status(403).json({ error: 'Forbidden' });

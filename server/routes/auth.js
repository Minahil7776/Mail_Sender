const r = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sign, auth } = require('../auth');
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

r.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Name, email and a 6+ character password are required' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ error: 'Email already registered' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.json({ token: sign(u), user: pub(u) });
});
r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(400).json({ error: 'Invalid email or password' });
  if (!u.active) return res.status(403).json({ error: 'Account disabled' });
  res.json({ token: sign(u), user: pub(u) });
});
r.get('/me', auth, (req, res) => res.json(pub(req.user)));
module.exports = r;

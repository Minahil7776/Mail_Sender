const r = require('express').Router();
const { User, Campaign, Contact } = require('../models');
const { auth, admin } = require('../auth');
r.use(auth);

r.get('/stats', async (req, res) => {
  const f = req.query.all && req.user.role === 'superadmin' ? {} : { owner: req.user._id };
  const [cs, contacts] = await Promise.all([Campaign.find(f).select('-recipients'), Contact.countDocuments(f)]);
  res.json({
    contacts, campaigns: cs.length, sent: cs.reduce((a, c) => a + c.sent, 0), failed: cs.reduce((a, c) => a + c.failed, 0),
    active: cs.filter((c) => ['sending', 'scheduled'].includes(c.status)).length,
  });
});
r.get('/users', admin, async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt').lean();
  const agg = await Campaign.aggregate([{ $group: { _id: '$owner', campaigns: { $sum: 1 }, sent: { $sum: '$sent' } } }]);
  const m = Object.fromEntries(agg.map((a) => [String(a._id), a]));
  res.json(users.map((u) => ({ ...u, campaigns: m[String(u._id)]?.campaigns || 0, sent: m[String(u._id)]?.sent || 0 })));
});
r.post('/users/:id/toggle', admin, async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.role === 'superadmin') return res.status(400).json({ error: 'Not allowed' });
  u.active = !u.active; await u.save(); res.json({ active: u.active });
});
r.delete('/users/:id', admin, async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.role === 'superadmin') return res.status(400).json({ error: 'Not allowed' });
  await Promise.all([Campaign.deleteMany({ owner: u._id }), Contact.deleteMany({ owner: u._id }), u.deleteOne()]);
  res.json({ ok: true });
});
module.exports = r;

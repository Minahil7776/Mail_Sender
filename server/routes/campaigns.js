const r = require('express').Router();
const { Campaign, Contact } = require('../models');
const { auth } = require('../auth');
r.use(auth);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const own = (req) => ({ _id: req.params.id, owner: req.user._id });

r.get('/', async (req, res) => res.json(await Campaign.find({ owner: req.user._id }).select('-recipients').sort('-createdAt')));

r.get('/:id', async (req, res) => {
  const c = await Campaign.findOne(own(req));
  if (!c) return res.status(404).json({ error: 'Not found' });
  const o = c.toObject(); o.recipients = o.recipients.filter((x) => x.status === 'failed').slice(0, 200);
  res.json(o);
});

// body: { name, subject, html, useContacts, emails, scheduledAt }
r.post('/', async (req, res) => {
  const { name, subject, html, useContacts, emails, scheduledAt } = req.body;
  if (!name || !subject || !html) return res.status(400).json({ error: 'Name, subject and message are required' });
  const map = new Map();
  if (useContacts) (await Contact.find({ owner: req.user._id })).forEach((c) => map.set(c.email, c.name));
  (emails || '').split(/[\s,;]+/).forEach((e) => { e = e.toLowerCase(); if (EMAIL.test(e)) map.set(e, map.get(e) || ''); });
  if (!map.size) return res.status(400).json({ error: 'No valid recipients' });
  const when = scheduledAt ? new Date(scheduledAt) : null;
  const c = await Campaign.create({
    owner: req.user._id, name, subject, html,
    recipients: [...map].map(([email, n]) => ({ email, name: n })), total: map.size,
    status: when ? 'scheduled' : 'draft', scheduledAt: when,
  });
  res.json({ id: c._id });
});

const set = (from, to) => async (req, res) => {
  const upd = { status: to };
  if (req.body.scheduledAt) upd.scheduledAt = new Date(req.body.scheduledAt);
  await Campaign.updateOne({ ...own(req), status: { $in: from } }, upd);
  res.json({ ok: true });
};
r.post('/:id/start', set(['draft', 'paused', 'scheduled'], 'sending'));
r.post('/:id/pause', set(['sending', 'scheduled'], 'paused'));
r.post('/:id/schedule', set(['draft', 'paused', 'scheduled'], 'scheduled'));
r.post('/:id/retry', async (req, res) => {
  const c = await Campaign.findOne(own(req));
  if (!c) return res.status(404).json({ error: 'Not found' });
  c.recipients.forEach((x) => { if (x.status === 'failed') { x.status = 'pending'; x.error = ''; } });
  c.failed = 0; c.status = 'sending'; await c.save(); res.json({ ok: true });
});
r.delete('/:id', async (req, res) => { await Campaign.deleteOne(own(req)); res.json({ ok: true }); });
module.exports = r;

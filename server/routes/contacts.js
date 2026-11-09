const r = require('express').Router();
const { Contact } = require('../models');
const { auth } = require('../auth');
r.use(auth);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

r.get('/', async (req, res) => res.json(await Contact.find({ owner: req.user._id }).sort('-createdAt').limit(5000)));
// body: { text: "Name,email\nemail\n..." }
r.post('/import', async (req, res) => {
  const rows = (req.body.text || '').split(/\r?\n/).map((l) => l.split(',').map((s) => s.trim())).filter((x) => x[0]);
  const docs = [];
  for (const c of rows) {
    const email = c.find((x) => EMAIL.test(x));
    if (email) docs.push({ owner: req.user._id, email: email.toLowerCase(), name: c.find((x) => x !== email) || '' });
  }
  let added = 0;
  try { added = (await Contact.insertMany(docs, { ordered: false })).length; }
  catch (e) { added = e.insertedDocs ? e.insertedDocs.length : 0; }
  res.json({ added, skipped: rows.length - added });
});
r.delete('/:id', async (req, res) => { await Contact.deleteOne({ _id: req.params.id, owner: req.user._id }); res.json({ ok: true }); });
module.exports = r;

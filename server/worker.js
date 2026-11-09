const nodemailer = require('nodemailer'), crypto = require('crypto');
const { Campaign, Stat, Unsub } = require('./models');
const tok = (e) => crypto.createHmac('sha256', process.env.JWT_SECRET).update(e.toLowerCase()).digest('hex').slice(0, 24);
const today = () => new Date().toISOString().slice(0, 10);
const errorDetails = (err) => {
  const details = [err?.message || String(err)];
  if (err?.code) details.push(`code=${err.code}`);
  if (err?.responseCode) details.push(`responseCode=${err.responseCode}`);
  if (err?.command) details.push(`command=${err.command}`);
  if (err?.response) details.push(`response=${err.response}`);
  return details.join(' | ').slice(0, 500);
};

function start() {
  const port = +process.env.SMTP_PORT || 465;
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_KEY || process.env.SMTP_PASS },
    pool: true,
  });
  t.on('error', (err) => console.error('SMTP transport error:', errorDetails(err)));
  t.verify()
    .then(() => console.log('SMTP connection and authentication successful'))
    .catch((err) => console.error('SMTP connection/authentication failed:', errorDetails(err)));
  const BATCH = +process.env.BATCH || 5, LIMIT = +process.env.DAILY_LIMIT || 400;
  let busy = false;
  setInterval(async () => {
    if (busy) return; busy = true;
    try {
      await Campaign.updateMany({ status: 'scheduled', scheduledAt: { $lte: new Date() } }, { status: 'sending' });
      const c = await Campaign.findOne({ status: 'sending' }).sort('updatedAt');
      if (!c) return;
      const stat = await Stat.findOneAndUpdate({ day: today() }, { $setOnInsert: { count: 0 } }, { upsert: true, new: true });
      const room = LIMIT - stat.count;
      if (room <= 0) return; // daily limit reached: campaign stays "sending" and resumes tomorrow
      const batch = c.recipients.filter((r) => r.status === 'pending').slice(0, Math.min(BATCH, room));
      const off = new Set((await Unsub.find({ email: { $in: batch.map((r) => r.email) } })).map((u) => u.email));
      let ok = 0;
      for (const r of batch) {
        if (off.has(r.email)) { r.status = 'failed'; r.error = 'Unsubscribed'; c.failed++; continue; }
        const link = `${process.env.PUBLIC_API_URL}/unsub?e=${encodeURIComponent(r.email)}&t=${tok(r.email)}`;
        try {
          const info = await t.sendMail({
            from: process.env.MAIL_FROM || {
              name: process.env.SMTP_NAME || process.env.SMTP_USER,
              address: process.env.SMTP_USER,
            },
            to: r.email, subject: c.subject,
            html: c.html.replace(/{{name}}/g, r.name || 'there') + `<p style="font-size:12px;color:#888">Don't want these emails? <a href="${link}">Unsubscribe</a></p>`,
            headers: { 'List-Unsubscribe': `<${link}>` },
          });
          const accepted = (info.accepted || []).some(
            (address) => String(address).toLowerCase() === r.email.toLowerCase(),
          );
          if (!accepted) {
            const err = new Error('SMTP server did not accept the recipient');
            err.response = info.response;
            throw err;
          }
          r.status = 'sent'; c.sent++; ok++;
        } catch (e) {
          r.status = 'failed';
          r.error = errorDetails(e);
          c.failed++;
          console.error(`Email send failed for campaign ${c._id}:`, r.error);
        }
      }
      if (ok) await Stat.updateOne({ day: today() }, { $inc: { count: ok } });
      if (!c.recipients.some((r) => r.status === 'pending')) { c.status = 'completed'; c.completedAt = new Date(); }
      c.markModified('recipients'); c.updatedAt = new Date(); await c.save();
    } catch (e) { console.error('Worker error:', errorDetails(e)); } finally { busy = false; }
  }, +process.env.INTERVAL_MS || 20000);
}
module.exports = { start, tok };

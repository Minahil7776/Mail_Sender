require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const { User } = require('./models');
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '5mb' }));
app.get('/api/unsub', async (req, res) => {
  const { e = '', t = '' } = req.query;
  if (require('./worker').tok(e) !== t) return res.status(400).send('Invalid link');
  await require('./models').Unsub.updateOne({ email: e.toLowerCase() }, { email: e.toLowerCase() }, { upsert: true });
  res.send('<p style="font-family:sans-serif">You have been unsubscribed and will not receive further emails.</p>');
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/admin', require('./routes/admin'));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const email = process.env.SUPERADMIN_EMAIL.toLowerCase();
  if (!(await User.findOne({ email }))) {
    await User.create({ name: 'Super Admin', email, password: await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 10), role: 'superadmin' });
    console.log('Super admin created:', email);
  }
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
  require('./worker').start();
}).catch((e) => { console.error(e); process.exit(1); });

const m = require('mongoose');
const User = m.model('User', new m.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'superadmin'], default: 'user' },
  active: { type: Boolean, default: true },
}, { timestamps: true }));

const Contact = m.model('Contact', new m.Schema({
  owner: { type: m.Schema.Types.ObjectId, ref: 'User', index: true },
  name: String,
  email: { type: String, lowercase: true },
}, { timestamps: true }));
Contact.schema.index({ owner: 1, email: 1 }, { unique: true });

const Campaign = m.model('Campaign', new m.Schema({
  owner: { type: m.Schema.Types.ObjectId, ref: 'User', index: true },
  name: String, subject: String, html: String,
  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'paused', 'completed'], default: 'draft' },
  scheduledAt: Date, completedAt: Date,
  total: { type: Number, default: 0 }, sent: { type: Number, default: 0 }, failed: { type: Number, default: 0 },
  recipients: [{ _id: false, email: String, name: String, status: { type: String, default: 'pending' }, error: String }],
}, { timestamps: true }));

const Stat = m.model('Stat', new m.Schema({ day: { type: String, unique: true }, count: { type: Number, default: 0 } }));
const Unsub = m.model('Unsub', new m.Schema({ email: { type: String, unique: true } }));
module.exports = { User, Contact, Campaign, Stat, Unsub };

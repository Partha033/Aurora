const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['system_config'] // We use a single document for global config
  },
  value: {
    paymentMethods: {
      cod: { type: Boolean, default: true },
      online: { type: Boolean, default: true }
    },
    shipping: {
      baseCharge: { type: Number, default: 100 },
      freeThreshold: { type: Number, default: 3000 }
    },
    contact: {
      email: { type: String, default: 'support@aurorajewels.com' },
      phone: { type: String, default: '+91 98765 43210' }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
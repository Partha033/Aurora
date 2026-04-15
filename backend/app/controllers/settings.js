const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");

module.exports = {
  // GET /settings — Get public config
  get: async (req, res) => {
    try {
      let settings = await db.settings.findOne({ key: 'system_config' });
      if (!settings) {
        // Initialize default settings if none exist
        settings = await db.settings.create({
          key: 'system_config',
          value: {
            paymentMethods: { cod: true, online: true },
            shipping: { baseCharge: 100, freeThreshold: 3000 },
            contact: { email: 'support@aurorajewels.com', phone: '+91 98765 43210' }
          }
        });
      }
      return res.success({ msg: 'Settings fetched', result: settings.value });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // PUT /settings — Update config (Admin only)
  update: async (req, res) => {
    try {
      const { paymentMethods, shipping, contact } = req.body;
      const updateData = {};
      if (paymentMethods) updateData['value.paymentMethods'] = paymentMethods;
      if (shipping)       updateData['value.shipping']       = shipping;
      if (contact)        updateData['value.contact']        = contact;

      const settings = await db.settings.findOneAndUpdate(
        { key: 'system_config' },
        { $set: updateData },
        { new: true, upsert: true }
      );

      return res.success({ msg: 'Settings updated successfully', result: settings.value });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  }
};
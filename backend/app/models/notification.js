const { mongoose } = require('../services/imports');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order_placed', 'order_status_update', 'order_cancelled', 'new_order'], required: true },
    metadata: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order' },
    },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('notification', notificationSchema, 'notification');

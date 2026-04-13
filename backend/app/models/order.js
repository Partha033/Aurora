const { mongoose } = require('../services/imports');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  category: { type: String },
}, { _id: true });

const orderSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      label: { type: String },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'pending' },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    orderStatus: { type: String, default: 'placed' },
    statusHistory: [{ status: { type: String }, updatedAt: { type: Date, default: Date.now }, note: { type: String } }],
    estimatedDelivery: { type: Date, default: null },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("order", orderSchema, "order");

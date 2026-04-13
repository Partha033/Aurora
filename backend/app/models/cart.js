const { mongoose } = require('../services/imports');

const cartItemSchema = new mongoose.Schema({
  product:         { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  priceAtAddition: { type: Number, required: true },
}, { _id: true });

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("cart", cartSchema, "cart");

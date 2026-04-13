const { mongoose } = require('../services/imports');

const productSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    description:     { type: String, required: true },
    price:           { type: Number, required: true },
    discountedPrice: { type: Number, default: null },
    discountPercent: { type: Number, default: 0 },
    images: [{
      url:      { type: String, required: true },
      publicId: { type: String, required: true },
    }],
    category:    { type: String, required: true, lowercase: true },
    stock:       { type: Number, required: true, default: 0 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    isActive:    { type: Boolean, default: true },
    isDeleted:   { type: Boolean, default: false },
    rating:      { type: Number, default: 0 },
    numReviews:  { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('product', productSchema, 'product');

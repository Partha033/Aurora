const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true
  },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    default: 'percentage' 
  },
  discountValue: { 
    type: Number, 
    required: true 
  },
  minOrderAmount: { 
    type: Number, 
    default: 0 
  },
  maxDiscountAmount: { 
    type: Number // Only relevant for percentage type
  },
  expiryDate: { 
    type: Date 
  },
  usageLimit: { 
    type: Number, 
    default: null // null means unlimited
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
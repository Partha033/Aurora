const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");

module.exports = {
  // Admin: Create Coupon
  create: async (req, res) => {
    try {
      const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit } = req.body;
      
      const existing = await db.coupon.findOne({ code: code.toUpperCase(), isDeleted: false });
      if (existing) return res.clientError({ msg: 'Coupon code already exists' });

      const coupon = await db.coupon.create({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        expiryDate,
        usageLimit
      });

      return res.success({ msg: 'Coupon created successfully', result: coupon });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // Admin: List all coupons
  list: async (req, res) => {
    try {
      const coupons = await db.coupon.find({ isDeleted: false }).sort({ createdAt: -1 });
      return res.success({ msg: 'Coupons fetched', result: coupons });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // Admin: Update Coupon
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const coupon = await db.coupon.findByIdAndUpdate(id, updates, { new: true });
      return res.success({ msg: 'Coupon updated', result: coupon });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // Admin: Soft Delete
  delete: async (req, res) => {
    try {
      await db.coupon.findByIdAndUpdate(req.params.id, { isDeleted: true });
      return res.success({ msg: 'Coupon deleted' });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // User: Apply/Validate Coupon
  apply: async (req, res) => {
    try {
      const { code, orderAmount } = req.body;
      const coupon = await db.coupon.findOne({ code: code.toUpperCase(), isDeleted: false, isActive: true });

      if (!coupon) return res.clientError({ msg: 'Invalid coupon code' });

      // Check Expiry
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.clientError({ msg: 'Coupon has expired' });
      }

      // Check Usage Limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.clientError({ msg: 'Coupon usage limit reached' });
      }

      // Check Min Amount
      if (orderAmount < coupon.minOrderAmount) {
        return res.clientError({ msg: `Minimum order of ₹${coupon.minOrderAmount} required` });
      }

      // Calculate Discount
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (orderAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
      } else {
        discount = coupon.discountValue;
      }

      return res.success({ 
        msg: 'Coupon applied', 
        result: { 
          code: coupon.code,
          discount,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        } 
      });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  }
};
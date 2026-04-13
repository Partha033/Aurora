const db      = require('../models');
const crypto  = require('crypto');
const Razorpay = require('razorpay');
const { errorHandlerFunction } = require('../middlewares/error');
const { paginationFn } = require('../utils/commonUtils');

const razorpay = new Razorpay({
  key_id:     process.env.RAZER_PAY_KEY_ID,
  key_secret: process.env.RAZER_PAY_KEY_SECRET,
});


const ORDER_STATUSES = ['placed','confirmed','processing','shipped','delivered','cancelled'];

module.exports = {
  // ── POST /order — place order from current cart ────────────────────────
  create: async (req, res) => {
    try {
      const { shippingAddress, paymentMethod = 'cod' } = req.body;
      if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
        return res.clientError({ msg: 'Complete shipping address is required' });
      }

      // Load cart
      const cart = await db.cart.findOne({ user: req.user._id, isDeleted: false }).populate('items.product');
      if (!cart || cart.items.length === 0) return res.clientError({ msg: 'Your cart is empty' });

      // Build order items from cart
      const items = cart.items.map(i => ({
        product:  i.product._id,
        name:     i.product.name,
        image:    i.product.images?.[0]?.url || '',
        price:    i.priceAtAddition,
        quantity: i.quantity,
        category: i.product.category,
      }));

      const subtotal      = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const shippingCharge = subtotal >= 999 ? 0 : 79;
      const totalAmount   = subtotal + shippingCharge;

      const order = await db.order.create({
        user: req.user._id,
        items,
        subtotal,
        shippingCharge,
        totalAmount,
        shippingAddress,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        orderStatus:   'placed',
        statusHistory: [{ status: 'placed', note: 'Order placed successfully' }],
      });

      // Decrement stock
      for (const item of items) {
        await db.product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }

      // Clear cart
      cart.items = [];
      await cart.save();

      res.success({ msg: 'Order placed successfully', result: { order } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── GET /order — list user's own orders ───────────────────────────────
  get: async (req, res) => {
    try {
      const _id = req.params.id;
      if (_id) {
        const data = await db.order.findOne({ _id, user: req.user._id, isDeleted: false }).populate('user', 'name email');
        if (data) return res.success({ result: { order: data } });
        return res.clientError({ msg: 'Order not found' });
      }

      const { perPage, currentPage } = req.query;
      const filterQuery = { user: req.user._id, isDeleted: false };
      const { rows, pagination } = await paginationFn(res, db.order, filterQuery, perPage, currentPage, null, { createdAt: -1 });

      res.success({ result: { rows, pagination } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── GET /order/admin/all — admin: all orders ───────────────────────────
  adminGetAll: async (req, res) => {
    try {
      const { perPage, currentPage, status, paymentStatus } = req.query;
      const filterQuery = { isDeleted: false };
      if (status)        filterQuery.orderStatus  = status;
      if (paymentStatus) filterQuery.paymentStatus = paymentStatus;

      const { rows, pagination } = await paginationFn(
        res, db.order, filterQuery, perPage || 20, currentPage || 1,
        null, { createdAt: -1 }
      );

      // Populate user info
      await db.order.populate(rows, { path: 'user', select: 'name email phone' });

      res.success({ result: { rows, pagination } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── PATCH /order/:id/status — admin: update order status ──────────────
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!ORDER_STATUSES.includes(status)) {
        return res.clientError({ msg: `Invalid status. Valid: ${ORDER_STATUSES.join(', ')}` });
      }

      const order = await db.order.findOne({ _id: id, isDeleted: false });
      if (!order) return res.clientError({ msg: 'Order not found' });

      order.orderStatus = status;
      order.statusHistory.push({ status, note: note || '', updatedAt: new Date() });

      if (status === 'delivered') {
        order.deliveredAt  = new Date();
        order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;
        order.isPaid        = order.paymentMethod === 'cod' ? true : order.isPaid;
      }

      await order.save();
      res.success({ msg: `Order status updated to "${status}"`, result: { order } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── GET /order/admin/dashboard — admin stats ───────────────────────────
  dashboard: async (req, res) => {
    try {
      const [
        totalOrders,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
        totalUsers,
        recentOrders,
        revenueByStatus,
      ] = await Promise.all([
        db.order.countDocuments({ isDeleted: false }),
        db.order.aggregate([
          { $match: { isDeleted: false, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        db.order.countDocuments({ isDeleted: false, orderStatus: 'placed' }),
        db.order.countDocuments({ isDeleted: false, orderStatus: 'delivered' }),
        db.order.countDocuments({ isDeleted: false, orderStatus: 'cancelled' }),
        db.product.countDocuments({ isDeleted: false, isActive: true }),
        db.user.countDocuments({ isDeleted: false, role: 'user' }),
        db.order.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5)
          .populate('user', 'name email'),
        // Revenue for last 7 days
        db.order.aggregate([
          {
            $match: {
              isDeleted: false,
              paymentStatus: 'paid',
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              revenue: { $sum: '$totalAmount' },
              count:   { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      res.success({
        result: {
          stats: {
            totalOrders,
            totalRevenue:   totalRevenue[0]?.total || 0,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            totalProducts,
            totalUsers,
          },
          recentOrders,
          revenueByDay: revenueByStatus,
        },
      });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── POST /order/razorpay — create Razorpay order ──────────────────────
  razorpayCreate: async (req, res) => {
    try {
      const { shippingAddress } = req.body;
      if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
        return res.clientError({ msg: 'Complete shipping address is required' });
      }

      // Load cart
      const cart = await db.cart.findOne({ user: req.user._id, isDeleted: false }).populate('items.product');
      if (!cart || cart.items.length === 0) return res.clientError({ msg: 'Your cart is empty' });

      const items = cart.items.map(i => ({
        product:  i.product._id,
        name:     i.product.name,
        image:    i.product.images?.[0]?.url || '',
        price:    i.priceAtAddition,
        quantity: i.quantity,
        category: i.product.category,
      }));

      const subtotal       = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const shippingCharge = subtotal >= 999 ? 0 : 79;
      const totalAmount    = subtotal + shippingCharge;

      // Create Razorpay order (amount in paise)
      const rpOrder = await razorpay.orders.create({
        amount:   Math.round(totalAmount * 100),
        currency: 'INR',
        receipt:  `receipt_${Date.now()}`,
        notes:    { userId: String(req.user._id) },
      });

      // Save a pending order in MongoDB
      const order = await db.order.create({
        user: req.user._id,
        items,
        subtotal,
        shippingCharge,
        totalAmount,
        shippingAddress,
        paymentMethod:   'online',
        paymentStatus:   'pending',
        orderStatus:     'placed',
        razorpayOrderId: rpOrder.id,
        statusHistory:   [{ status: 'placed', note: 'Razorpay payment initiated' }],
      });

      return res.success({
        msg: 'Razorpay order created',
        result: {
          razorpayOrderId: rpOrder.id,
          keyId:           process.env.RAZER_PAY_KEY_ID,
          amount:          rpOrder.amount,
          currency:        rpOrder.currency,
          orderId:         order._id,
        },
      });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── POST /order/razorpay/verify — verify payment & fulfil order ────────
  razorpayVerify: async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.clientError({ msg: 'Missing payment verification fields' });
      }

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZER_PAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.clientError({ msg: 'Payment verification failed — invalid signature' });
      }

      // Find the pending order
      const order = await db.order.findOne({ razorpayOrderId: razorpay_order_id, isDeleted: false });
      if (!order) return res.clientError({ msg: 'Order not found' });

      // Mark as paid
      order.paymentStatus      = 'paid';
      order.isPaid             = true;
      order.paidAt             = new Date();
      order.razorpayPaymentId  = razorpay_payment_id;
      order.razorpaySignature  = razorpay_signature;
      order.orderStatus        = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Payment verified via Razorpay' });
      await order.save();

      // Decrement stock
      for (const item of order.items) {
        await db.product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }

      // Clear cart
      const cart = await db.cart.findOne({ user: order.user, isDeleted: false });
      if (cart) { cart.items = []; await cart.save(); }

      return res.success({ msg: 'Payment verified successfully ✦', result: { order } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },
};

const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");
const { paginationFn } = require("../utils/commonUtils");

module.exports = {
  // ── GET /cart — fetch cart with populated products ─────────────────────
  get: async (req, res) => {
    try {
      let cart = await db.cart
        .findOne({ user: req.user._id, isDeleted: false })
        .populate('items.product');

      if (!cart) {
        return res.success({ result: { items: [], subtotal: 0, total: 0 } });
      }

      // Re-calculate totals from live product prices
      const items = cart.items.filter(i => i.product && !i.product.isDeleted);
      // Load Settings for shipping
      const settingsDoc = await db.settings.findOne({ key: 'system_config' });
      const shippingSettings = settingsDoc?.value?.shipping || { baseCharge: 100, freeThreshold: 3000 };

      const subtotal = items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0);
      const shipping = subtotal >= shippingSettings.freeThreshold ? 0 : shippingSettings.baseCharge;
      const total    = subtotal + shipping;

      res.success({ result: { _id: cart._id, items, subtotal, shipping, total } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── POST /cart — add product to cart (upsert) ──────────────────────────
  addItem: async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      if (!productId) return res.clientError({ msg: 'productId is required' });

      const product = await db.product.findOne({ _id: productId, isDeleted: false, isActive: true });
      if (!product) return res.clientError({ msg: 'Product not found' });
      if (product.stock < quantity) return res.clientError({ msg: 'Insufficient stock' });

      let cart = await db.cart.findOne({ user: req.user._id, isDeleted: false });

      if (!cart) {
        cart = await db.cart.create({
          user: req.user._id,
          items: [{ product: productId, quantity, priceAtAddition: product.discountedPrice || product.price }],
        });
      } else {
        const idx = cart.items.findIndex(i => i.product.toString() === productId);
        if (idx > -1) {
          cart.items[idx].quantity += quantity;
        } else {
          cart.items.push({ product: productId, quantity, priceAtAddition: product.discountedPrice || product.price });
        }
        await cart.save();
      }

      cart = await db.cart.findById(cart._id).populate('items.product');
      // Load Settings for shipping
      const settingsDoc = await db.settings.findOne({ key: 'system_config' });
      const shippingSettings = settingsDoc?.value?.shipping || { baseCharge: 100, freeThreshold: 3000 };

      const subtotal = cart.items.reduce((s, i) => s + i.priceAtAddition * i.quantity, 0);
      const shipping = subtotal >= shippingSettings.freeThreshold ? 0 : shippingSettings.baseCharge;

      res.success({ msg: 'Item added to cart', result: { _id: cart._id, items: cart.items, subtotal, shipping, total: subtotal + shipping } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── PATCH /cart/:itemId — update quantity ──────────────────────────────
  updateItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) return res.clientError({ msg: 'Quantity must be at least 1' });

      const cart = await db.cart.findOne({ user: req.user._id, isDeleted: false });
      if (!cart) return res.clientError({ msg: 'Cart not found' });

      const idx = cart.items.findIndex(i => i._id.toString() === itemId);
      if (idx === -1) return res.clientError({ msg: 'Item not found in cart' });

      cart.items[idx].quantity = quantity;
      await cart.save();

      const populated = await db.cart.findById(cart._id).populate('items.product');
      // Load Settings for shipping
      const settingsDoc = await db.settings.findOne({ key: 'system_config' });
      const shippingSettings = settingsDoc?.value?.shipping || { baseCharge: 100, freeThreshold: 3000 };

      const subtotal = populated.items.reduce((s, i) => s + i.priceAtAddition * i.quantity, 0);
      const shipping = subtotal >= shippingSettings.freeThreshold ? 0 : shippingSettings.baseCharge;

      res.success({ msg: 'Cart updated', result: { _id: populated._id, items: populated.items, subtotal, shipping, total: subtotal + shipping } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── DELETE /cart/:itemId — remove one item ─────────────────────────────
  removeItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const cart = await db.cart.findOne({ user: req.user._id, isDeleted: false });
      if (!cart) return res.clientError({ msg: 'Cart not found' });

      cart.items = cart.items.filter(i => i._id.toString() !== itemId);
      await cart.save();

      const populated = await db.cart.findById(cart._id).populate('items.product');
      // Load Settings for shipping
      const settingsDoc = await db.settings.findOne({ key: 'system_config' });
      const shippingSettings = settingsDoc?.value?.shipping || { baseCharge: 100, freeThreshold: 3000 };

      const subtotal = populated.items.reduce((s, i) => s + i.priceAtAddition * i.quantity, 0);
      const shipping = subtotal >= shippingSettings.freeThreshold ? 0 : shippingSettings.baseCharge;

      res.success({ msg: 'Item removed', result: { _id: populated._id, items: populated.items, subtotal, shipping, total: subtotal + shipping } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── DELETE /cart — clear entire cart ──────────────────────────────────
  clearCart: async (req, res) => {
    try {
      await db.cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [] },
        { new: true }
      );
      res.success({ msg: 'Cart cleared' });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },
};

const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");
const { paginationFn } = require("../utils/commonUtils");
const { deleteFromCloudinary } = require("../utils/cloudinary");

module.exports = {
  // ── POST /product — admin create ───────────────────────────────────────
  create: async (req, res) => {
    try {
      const { name, description, price, discountedPrice, category, stock, discountPercent } = req.body;

      if (!name || !description || !price || !category || !stock) {
        return res.clientError({ msg: 'name, description, price, category and stock are required' });
      }
      if (!req.files || req.files.length === 0) {
        return res.clientError({ msg: 'At least one product image is required' });
      }

      const images = req.files.map((file) => ({
        url:      file.path,
        publicId: file.filename,
      }));

      // Auto-compute discountPercent if not provided
      const dp = discountedPrice ? parseFloat(discountedPrice) : null;
      const pct = discountPercent
        ? parseInt(discountPercent)
        : dp && dp < parseFloat(price)
          ? Math.round((1 - dp / parseFloat(price)) * 100)
          : 0;

      const data = await db.product.create({
        name:            name.trim(),
        description:     description.trim(),
        price:           parseFloat(price),
        discountedPrice: dp,
        discountPercent: pct,
        category:        category.toLowerCase(),
        stock:           parseInt(stock) || 0,
        images,
        createdBy:       req.user._id,
        isActive:        true,
      });

      try {
        const socketService = require('../services/socket');
        const io = socketService.getIo();
        io.emit('product_update');
      } catch (err) {}

      return res.success({ msg: 'Product created successfully', result: data });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── GET /product — public (isActive) / admin (all) ────────────────────
  get: async (req, res) => {
    try {
      const _id = req.params.id;
      const { search, category, sortBy, perPage, currentPage, adminView } = req.query;
      const isAdminView = adminView === 'true' || req.user?.role === 'admin';

      // Filter: admin sees all (including hidden), public sees only active
      const filterQuery = { isDeleted: false };
      if (!isAdminView) filterQuery.isActive = true;

      if (_id) {
        const data = await db.product.findOne({ ...filterQuery, _id });
        if (data) return res.success({ msg: 'Data fetched successfully', result: data });
        return res.clientError({ msg: 'Product not found' });
      }

      if (category)  filterQuery.category = category.toLowerCase();
      if (search)    filterQuery.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];

      let sort = { createdAt: -1 };
      if (sortBy === 'price_asc')  sort = { price: 1 };
      if (sortBy === 'price_desc') sort = { price: -1 };
      if (sortBy === 'rating')     sort = { rating: -1 };
      if (sortBy === 'newest')     sort = { createdAt: -1 };

      const { rows, pagination } = await paginationFn(
        res, db.product, filterQuery, perPage, currentPage, '-createdBy', sort
      );

      return res.success({ msg: 'Data fetched successfully', result: { rows, pagination } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── PUT /product/:id — admin update ───────────────────────────────────
  update: async (req, res) => {
    try {
      const _id = req.params.id;
      const product = await db.product.findOne({ isDeleted: false, _id });
      if (!product) return res.clientError({ msg: 'Product not found' });

      const { name, description, price, discountedPrice, category, stock, isActive, discountPercent } = req.body;
      const updateData = {};

      if (name        !== undefined) updateData.name        = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (category    !== undefined) updateData.category    = category.toLowerCase();
      if (stock       !== undefined) updateData.stock       = parseInt(stock);
      if (price       !== undefined) updateData.price       = parseFloat(price);
      if (isActive    !== undefined) updateData.isActive    = isActive === 'true' || isActive === true;
      if (discountedPrice !== undefined) {
        updateData.discountedPrice = discountedPrice ? parseFloat(discountedPrice) : null;
      }

      // Recompute discountPercent
      const finalPrice = updateData.price        || product.price;
      const finalDisc  = updateData.discountedPrice !== undefined ? updateData.discountedPrice : product.discountedPrice;
      if (discountPercent !== undefined) {
        updateData.discountPercent = parseInt(discountPercent);
      } else if (finalDisc && finalDisc < finalPrice) {
        updateData.discountPercent = Math.round((1 - finalDisc / finalPrice) * 100);
      }

      // Handle new images — replace all
      if (req.files && req.files.length > 0) {
        // Delete old images from Cloudinary
        for (const img of product.images) {
          if (img.publicId) await deleteFromCloudinary(img.publicId);
        }
        updateData.images = req.files.map((file) => ({
          url:      file.path,
          publicId: file.filename,
        }));
      }

      await db.product.updateOne({ _id }, { $set: updateData });
      const updated = await db.product.findById(_id);

      try {
        const socketService = require('../services/socket');
        const io = socketService.getIo();
        io.emit('product_update');
      } catch (err) {}

      return res.success({ msg: 'Product updated successfully', result: updated });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── DELETE /product/:id — soft delete ─────────────────────────────────
  delete: async (req, res) => {
    try {
      const _id = req.params.id;
      const product = await db.product.findOne({ isDeleted: false, _id });
      if (!product) return res.clientError({ msg: 'Product not found' });

      await db.product.updateOne({ _id }, { isDeleted: true, isActive: false });

      try {
        const socketService = require('../services/socket');
        const io = socketService.getIo();
        io.emit('product_update');
      } catch (err) {}

      return res.success({ msg: 'Product deleted successfully' });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── PATCH /product/:id/toggle — admin toggle visibility ───────────────
  toggle: async (req, res) => {
    try {
      const _id = req.params.id;
      const product = await db.product.findOne({ isDeleted: false, _id });
      if (!product) return res.clientError({ msg: 'Product not found' });

      await db.product.updateOne({ _id }, { isActive: !product.isActive });

      try {
        const socketService = require('../services/socket');
        const io = socketService.getIo();
        io.emit('product_update');
      } catch (err) {}

      return res.success({
        msg: `Product ${!product.isActive ? 'shown' : 'hidden'} successfully`,
        result: { isActive: !product.isActive },
      });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },
};

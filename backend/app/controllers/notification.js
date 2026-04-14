const db = require('../models');
const { errorHandlerFunction } = require('../middlewares/error');
const { paginationFn } = require('../utils/commonUtils');

module.exports = {
  // GET /notification - list notifications for current user
  get: async (req, res) => {
    try {
      const { perPage, currentPage } = req.query;
      const filterQuery = { user: req.user._id, isDeleted: false };
      const { rows, pagination } = await paginationFn(res, db.notification, filterQuery, perPage, currentPage, null, { createdAt: -1 });

      res.success({ result: { rows, pagination } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // PATCH /notification/:id/read - mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await db.notification.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { isRead: true },
        { new: true }
      );
      if (!notification) return res.clientError({ msg: 'Notification not found' });
      res.success({ msg: 'Notification marked as read', result: { notification } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // PATCH /notification/read-all - mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      await db.notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
      );
      res.success({ msg: 'All notifications marked as read' });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // DELETE /notification/:id - soft delete a notification
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await db.notification.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { isDeleted: true },
        { new: true }
      );
      if (!notification) return res.clientError({ msg: 'Notification not found' });
      res.success({ msg: 'Notification deleted', result: { notification } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  }
};

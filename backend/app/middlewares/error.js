module.exports = {
  errorHandlerFunction: (res, error) => {
    console.error(error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      msg: error.message || "Internal Server Error",
    });
  },
};

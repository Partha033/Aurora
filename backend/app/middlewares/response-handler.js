module.exports = (req, res, next) => {
  res.success = ({ msg = "Success", result = {} }) => {
    return res.status(200).json({
      success: true,
      msg,
      result,
    });
  };

  res.clientError = ({ msg = "Client Error", result = {} }) => {
    return res.status(400).json({
      success: false,
      msg,
      result,
    });
  };
  next();
};

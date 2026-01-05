const generalResponse = (
  res,
  data = {},
  message = "",
  success = true,
  showMessage = true,
  code = 200
) => {
  return res.status(code).json({
    success,
    message: showMessage ? message : undefined,
    data,
  });
};

const errorResponse = (res, message = "Error", code = 400) => {
  return res.status(code).json({
    success: false,
    message,
    data: {},
  });
};

module.exports = {
  generalResponse,
  errorResponse,
};
  

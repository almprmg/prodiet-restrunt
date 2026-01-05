const { verifyAccessToken } = require("../utils/jwt.util");
const { errorResponse } = require("../utils/response.util");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return errorResponse(res, "No token provided", 401);

    const token = authHeader.split(" ")[1];
    if (!token) return errorResponse(res, "Invalid token format", 401);

    const decoded = verifyAccessToken(token);
    req.user = decoded; // يمكنك استخدام req.user لاحقًا في Controller
    next();
  } catch (err) {
    return errorResponse(res, "Invalid or expired token", 401);
  }
};

module.exports = authMiddleware;

import jwt from "jsonwebtoken"
import User from "../models/user.models.js"

const isAuth = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
        success: false
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // DB check: reject immediately if account has been disabled by admin
    const user = await User.findById(req.userId).select("isActive");
    if (!user || user.isActive === false) {
      return res.status(403).json({
        message: "Account is disabled. Please contact support.",
        success: false
      });
    }

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.error("JWT verification failed:", err.name);
      res.clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
      });
      return res.status(401).json({
          message: "Session expired or invalid. Please login again.",
          success: false
      });
    }

    console.error("Auth middleware error:", err.message);
    return res.status(500).json({
      message: "Internal server error during authentication",
      success: false
    });
  }
};

export default isAuth;

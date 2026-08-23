import User from "../models/user.models.js";

/**
 * isAdmin middleware — runs AFTER isAuth (req.userId is guaranteed to be set).
 * Fetches user from DB and checks role === "admin".
 * The database is the ONLY source of truth — frontend role is never trusted.
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("role isActive");

    if (!user) {
      return res.status(401).json({ message: "User not found", success: false });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: Admin access required",
        success: false
      });
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Admin authorization error: ${err.message}`,
      success: false
    });
  }
};

export default isAdmin;

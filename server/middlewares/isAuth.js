import jwt from "jsonwebtoken"

const isAuth = (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token) {
      return res.status(400).json({
        message: "user does not have token",
        success: false
      });
    }

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = verifyToken.userId;

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Is Authentication error ${err}`,
      success: false
    });
  }
};

export default isAuth;

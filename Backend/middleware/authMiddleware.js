const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided" });
  }

  try {
    const bearerToken = token.split(" ")[1]; // Extract token from "Bearer <token>"
    if (!bearerToken) {
      return res.status(400).json({ message: "Bearer token missing" });
    }
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request object
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error("Token verification failed:", error); // Log the actual error
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = authMiddleware;

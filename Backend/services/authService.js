const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const registerUser = async (username, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const newUser = new User({ username, email, password });
  await newUser.save();

  return { id: newUser._id, username: newUser.username, email: newUser.email };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return {
    token,
    user: { id: user._id, username: user.username, email: user.email },
  };
};

module.exports = { registerUser, loginUser };

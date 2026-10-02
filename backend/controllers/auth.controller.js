const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error("Please provide name, email and password"); }
  if (password.length < 6) { res.status(400); throw new Error("Password must be at least 6 characters"); }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) { res.status(400); throw new Error("An account with this email already exists"); }

  const user = await User.create({ name, email, passwordHash: password });

  res.status(201).json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email },
    token: generateToken(user._id),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error("Please provide email and password"); }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error("Invalid email or password"); }

  res.json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email },
    token: generateToken(user._id),
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { registerUser, loginUser, getMe };
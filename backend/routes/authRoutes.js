const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.log("Missing required fields:", { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({ msg: "Please enter a valid email address" });
    }

    // Check if username is taken
    let userExists = await User.findOne({ username });
    if (userExists) {
      console.log("Username already taken:", username);
      return res.status(400).json({ msg: "Username already taken" });
    }

    // Check if email is taken
    userExists = await User.findOne({ email });
    if (userExists) {
      console.log("Email already registered:", email);
      return res.status(400).json({ msg: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();
    console.log("User registered successfully:", { username, email });
    
    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      msg: "Server error during registration",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Simple auth status endpoint
router.get('/status', (req, res) => {
    res.json({ 
        success: true,
        data: {
            isAuthenticated: false,
            message: 'Authentication not required for current features'
        }
    });
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", { username: req.body.username });
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    // Check for user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("User logged in successfully:", { username });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      msg: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

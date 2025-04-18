const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET;

/**
 * Check login middleware
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized." });
  }
};

/**
 * GET /admin
 * Admin - Login page
 */

router.get("/admin", async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "A simple blog created with NodeJs, Express and MongoDB.",
    };

    res.render("admin/index", { locals, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

/**
 * GET /dashboard
 * Admin - Dashboard page
 */

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Admin dashboard",
      description: "A simple blog created with NodeJs, Express and MongoDB.",
    };

    const data = await Post.find();
    res.render("admin/dashboard", { locals, data, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

/**
 * GET /
 * Admin - Create new post
 */

router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Admin post",
      description: "A simple blog created with NodeJs, Express and MongoDB.",
    };

    res.render("admin/add-post", { locals, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

/**
 * POST /
 * Admin - Create new post
 */

router.post("/add-post", authMiddleware, async (req, res) => {
  try {
    const { title, body } = req.body;
    const newPost = new Post({ title, body });
    await Post.create(newPost);
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
  }
});

/**
 * GET /
 * Admin - Edit post
 */

router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const data = await Post.findOne({ _id: req.params.id });
    const locals = {
      title: `Edit post: ${data.title}`,
      description: "A simple blog created with NodeJs, Express and MongoDB.",
    };

    res.render("admin/edit-post", { locals, data, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

/**
 * PUT /
 * Admin - Create new post
 */

router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, body } = req.body;

    await Post.findByIdAndUpdate(id, {
      title,
      body,
      updatedAt: Date.now(),
    });

    res.redirect(`/edit-post/${id}`);
  } catch (error) {
    console.error(error);
  }
});

/**
 * POST /admin
 * Admin - Check login
 */

router.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
  }
});

/**
 * POST /admin
 * Admin - Register
 */

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, password: hashedPassword });
      res.status(201).json({ message: "User created.", user });
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).json({ message: "User already in use." });
      }
      res.status(500).json({ message: "Internal Server error." });
    }
  } catch (error) {
    console.error(error);
  }
});

/**
 * DELETE /
 * Admin - Delete post
 */

router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
  }
});

/**
 * GET /
 * Admin - Logout
 */

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  // res.json({ message: "Logout successful." });
  res.redirect("/");
});

module.exports = router;

const bcrypt = require("bcrypt");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { UserModel, BlogModel } = require("./db");
const { auth, JWT_SECRET } = require("./auth");

mongoose.connect("YOUR_MONGO-DB_URI");

const app = express();
app.use(express.json());

// Signup
app.post("/signup", async (req, res) => {
    const schema = z.object({
        email: z.string().min(5).max(50).email(),
        username: z.string().min(5).max(20),
        password: z.string().min(12).max(30)
    });

    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.json({
            message: "Incorrect format",
            error: result.error
        });
    }

    try {
        const { email, password, username } = req.body;
        const hashedPassword = await bcrypt.hash(password, 5);
        await UserModel.create({ email, password: hashedPassword, username });
        res.json({ message: "You are signed up" });
    } catch (error) {
        res.json({ message: "User already exists" });
    }
});

// Signin
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
        return res.status(403).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET);
        res.json({ token });
    } else {
        res.status(403).json({ message: "Incorrect credentials" });
    }
});

// Create Blog
app.post("/blog", auth, async (req, res) => {
    const { title, paragraph } = req.body;
    const userId = req.userId;

    try {
        await BlogModel.create({ userId, title, paragraph });
        res.json({ message: "Blog created" });
    } catch (error) {
        res.status(500).json({ message: "Error creating blog" });
    }
});

// List blogs of all user
app.get("/blogs", auth, async (req, res) => {
    try {
        const blogs = await BlogModel.find();
        res.json({ blogs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching blogs" });
    }
});

// List Blogs by Username
app.get("/blogs/:username", auth, async (req, res) => {
    const { username } = req.params;

    try {
        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const blogs = await BlogModel.find({ userId: user._id }); // Find blogs by user's ObjectId
        res.json({ blogs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching blogs" });
    }
});

// Edit Blog
app.put("/blog/edit/:id", auth, async (req, res) => {
    const { id } = req.params;
    const { title, paragraph } = req.body;

    try {
        const blog = await BlogModel.findById(id);

        // Blog not found
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Ensure the blog belongs to the authenticated user
        if (blog.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "You are not authorized to edit this blog" });
        }

        // Update blog fields if new values are provided
        blog.title = title || blog.title;
        blog.paragraph = paragraph || blog.paragraph;
        await blog.save();

        res.json({ message: "Blog updated" });
    } catch (error) {
        res.status(500).json({ message: "Error updating blog", error: error.message });
    }
});


// Delete Blog
app.delete("/blog/:id", auth, async (req, res) => {
    const { id } = req.params;

    try {
        const blog = await BlogModel.findById(id);

        // Blog not found
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Ensure the blog belongs to the authenticated user
        if (blog.userId.toString() !== req.userId) {
            return res.status(403).json({ message: "You are not authorized to delete this blog" });
        }

        await BlogModel.findByIdAndDelete(id);
        res.json({ message: "Blog deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting blog", error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));


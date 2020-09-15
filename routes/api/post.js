const express = require("express");
const router = express.Router();
const config = require("config");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

//Post      api/posts/
//Access    private
//Create a post
router.post(
  "/",
  [auth, [check("text", "Text is required").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array());
    }

    try {
      const user = await User.findOne({ _id: req.user.id }).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: user._id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

//Get      api/posts
//Access    private
//Get all posts
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

//Get      api/posts/:id
//Access    private
//Get post by id
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    //To check invalid objectId
    if (error.kind === "ObjectId") {
      return res.status(404).send("Post not found");
    }
    res.status(500).send("Server Error");
  }
});

//Delete     api/posts/:id
//Access    private
//Delete a post by id
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).send("Post not found");
    }
    //Check if post user is the user sending request
    if (post.user.toString() !== req.user.id) {
      return res.status(401).send("Not authorized");
    }
    await post.remove();

    res.send("Post removed");
  } catch (error) {
    console.error(error.message);
    //To check invalid objectId
    if (error.kind === "ObjectId") {
      return res.status(404).send("Post not found");
    }
    res.status(500).send("Server Error");
  }
});
//Post      api/posts/comment/:id
//Access    private
//Comment on a post
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array());
    }

    try {
      const user = await User.findOne({ _id: req.user.id }).select("-password");
      const post = await Post.findById(req.params.id);
      const newComment = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: user._id,
      });

      post.comments.unshift(newComment);
      await post.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

//Delete      api/posts/comment/:post_id/:comment_id
//Access    private
//Delete Comment on a post
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //Pull out a comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    //If no comment
    if (!comment) {
      return res.status(404).send("Comment not found");
    }

    //Check if user deleting the comment is the one who made it
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).send("Not authorized");
    }
    //Get remove index
    const removeIndex = post.comments
      .map((c) => c._id.toString())
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

//Put      api/posts/like/:id
//Access    private
//Like a a post
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //Check if already liked by this user
    if (
      post.likes.filter((l) => l.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).send("Post already liked");
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

//Put      api/posts/unlike/:id
//Access    private
//Like a a post
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //Check if already liked by this user
    if (
      post.likes.filter((l) => l.user.toString() === req.user.id).length === 0
    ) {
      return res.status(400).send("Post has not yet been liked");
    }

    //Get remove index
    const removeIndex = post.likes
      .map((l) => l._id.toString())
      .indexOf(req.params.id);

    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;

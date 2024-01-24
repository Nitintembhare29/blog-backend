const express = require("express");
const Blog = require("../Models/blogModel");
const { blogDataValidator } = require("../Utils/blogUtils");
const { followingUserList } = require("../Models/followModel");
const User = require("../Models/userModel");

const blogRouter = express.Router();

blogRouter.post("/create-blog", async (req, res) => {
  const { title, textBody } = req.body;
  const userId = req.locals.userId;
  const username = req.locals.username;
  const creationDateTime = Date.now();

  try {
    await blogDataValidator({ title, textBody });
  } catch (error) {
    return res.send({
      status: 400,
      message: "Invalid Data",
      error: error,
    });
  }

  try {
    const userDb = await User.verifyUserId({ userId });
  } catch (error) {
    res.send({
      status: 400,
      error: error,
    });
  }

  try {
    const blogObj = new Blog({
      title,
      textBody,
      userId,
      creationDateTime,
      username,
    });
    const blogDb = await blogObj.createBlog();
    return res.send({
      status: 201,
      message: "Blog created successfully",
      data: blogDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});

// /get-blogs?skip=5
blogRouter.get("/get-blogs", async (req, res) => {
  const SKIP = parseInt(req.query.skip) || 0;
  const LIMIT = parseInt(process.env.LIMIT);
  const followerUserId = req.locals.userId;

  try {
    // all blogs
    // const blogDb = await Blog.getBlog({ SKIP, LIMIT });
    // return res.send({
    //   status: 200,
    //   message: "Read success",
    //   data: blogDb,
    // });

    // get blogs of following user only

    const followingUserDetails = await followingUserList({
      followerUserId,
      SKIP: 0,
      LIMIT,
    });

    const followingUserIds = [];

    followingUserDetails.map((user) => {
      followingUserIds.push(user._id);
    });

    const blogDb = await Blog.getBlog({ followingUserIds, SKIP, LIMIT });

    return res.send({
      status: 200,
      message: "Read success",
      data: blogDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});

// /my-blogs?skip=5
blogRouter.get("/my-blogs", async (req, res) => {
  const SKIP = parseInt(req.query.skip) || 0;
  const LIMIT = parseInt(process.env.LIMIT);
  const userId = String(req.locals.userId);

  try {
    const myblogDb = await Blog.myBlog({ SKIP, LIMIT, userId });
    return res.send({
      status: 200,
      message: "Read success",
      data: myblogDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});

// edit blog
blogRouter.post("/edit-blog", async (req, res) => {
  const { title, textBody, blogId } = req.body;
  //   const userId = req.session.user.userId;
  const userId = req.locals.userId;

  // validate title, textBody
  try {
    await blogDataValidator({ title, textBody });
  } catch (error) {
    return res.send({
      status: 400,
      error: error,
    });
  }

  // find blog
  try {
    const blogDb = await Blog.getBlogWithId({ blogId });

    // check ownership
    // if(blogDb.userId.toString() === userId.toString())
    // id1.equals(id2)
    if (!blogDb.userId.equals(userId)) {
      return res.send({
        status: 401,
        message: "not athorised to edit blog",
      });
    }

    // not allowed to edit after 30 minutes
    const diff =
      new Date(String(Date.now()) - blogDb.creationDateTime).getTime() /
      (1000 * 60);

    if (diff > 30) {
      return res.send({
        status: 400,
        message: "Not allowed to edit after 30 minutes",
      });
    }

    const blogObj = new Blog({
      title,
      textBody,
      userId,
      creationDateTime: blogDb.creationDateTime,
      blogId,
    });
    const olbBlogDb = await blogObj.updateBlog();
    return res.send({
      status: 200,
      message: "Blog edited successfully",
      data: olbBlogDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});

// delete blog
blogRouter.post("/delete-blog", async (req, res) => {
  const blogId = req.body.blogId;
  const userId = req.locals.userId;

  try {
    const blogDb = await Blog.getBlogWithId({ blogId });

    // check ownership
    if (!blogDb.userId.equals(userId)) {
      return res.send({
        status: 401,
        message: "Not athorised to delete blog",
      });
    }

    // delete blog
    const deletedBlog = await Blog.deleteBlog({ blogId });

    return res.send({
      status: 200,
      message: "Blog deleted successfully",
      data: deletedBlog,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database error",
      error: error,
    });
  }
});

module.exports = blogRouter;

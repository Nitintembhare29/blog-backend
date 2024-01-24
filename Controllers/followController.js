const express = require("express");
const User = require("../Models/userModel");
const {
  followUser,
  followerUserList,
  followingUserList,
  unfollowUser,
  nonFollowingUserList,
} = require("../Models/followModel");

const followRouter = express.Router();

followRouter.post("/follow-user", async (req, res) => {
  //   const followerUserId = req.session.user.userId;
  const followerUserId = req.locals.userId;
  const followingUserId = req.body.followingUserId;

  console.log(followerUserId, followingUserId);

  try {
    await User.verifyUserId({ userId: followerUserId });
  } catch (error) {
    return res.send({
      status: 400,
      message: "Invalid follower user id",
      error: error,
    });
  }

  try {
    await User.verifyUserId({ userId: followingUserId });
  } catch (error) {
    return res.send({
      status: 400,
      message: "Invalid following user id",
      error: error,
    });
  }

  try {
    const followDb = await followUser({ followerUserId, followingUserId });
    return res.send({
      status: 201,
      message: "Follow successfull",
      data: followDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

// get followers list
followRouter.get("/followers-list", async (req, res) => {
  const followingUserId = req.locals.userId;
  const SKIP = parseInt(req.query.skip) || 0;
  const LIMIT = parseInt(process.env.LIMIT);

  try {
    const followerList = await followerUserList({
      followingUserId,
      LIMIT,
      SKIP,
    });
    return res.send({
      status: 200,
      message: "FollowerList Read success",
      data: followerList,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

// get followings list
followRouter.get("/following-list", async (req, res) => {
  const followerUserId = req.locals.userId;
  const SKIP = parseInt(req.query.skip) || 0;
  const LIMIT = parseInt(process.env.LIMIT);

  try {
    const followingList = await followingUserList({
      followerUserId,
      LIMIT,
      SKIP,
    });
    return res.send({
      status: 200,
      message: "FollowingList Read success",
      data: followingList,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

// get nonFollowings list
followRouter.get("/non-following-list", async (req, res) => {
  const followerUserId = req.locals.userId;
  const SKIP = parseInt(req.query.skip) || 0;
  const LIMIT = parseInt(process.env.LIMIT);

  try {
    const nonfollowingList = await nonFollowingUserList({
      followerUserId,
      LIMIT,
      SKIP,
    });
    return res.send({
      status: 200,
      message: "non FollowingList Read success",
      data: nonfollowingList,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

// unfollow following user

followRouter.post("/unfollow-user", async (req, res) => {
  const followerUserId = req.locals.userId;
  const followingUserId = req.body.followingUserId;

  try {
    const unfollowDb = await unfollowUser({ followerUserId, followingUserId });

    return res.send({
      status: 200,
      message: "unfollowed successfully",
      data: unfollowDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});
module.exports = followRouter;

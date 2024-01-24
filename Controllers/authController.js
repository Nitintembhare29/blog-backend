const express = require("express");
const bcrypt = require("bcrypt");
const authRouter = express.Router();
const { cleanupAndValidate } = require("../Utils/authUtils");

const User = require("../Models/userModel");
const isAuth = require("../Middlewares/authMiddleware");
const jwt = require("jsonwebtoken");

authRouter.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    // check if email or username exist
    await User.findUsernameAndEmailExist({ email, username });

    await cleanupAndValidate({ name, email, username, password });
  } catch (error) {
    return res.send({
      status: 400,
      message: "Data issue",
      error: error,
    });
  }

  try {
    const userObj = new User({ name, username, email, password });
    const userDb = await userObj.registerUser();
    return res.send({
      status: 201,
      message: "User created successfully!",
      data: userDb,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.send({
      status: 400,
      message: "Missing Credentials",
    });
  }

  try {
    const userDb = await User.findUserEmailOrUsername({ loginId });

    const isMatch = await bcrypt.compare(password, userDb.password);

    if (!isMatch) {
      return res.send({
        status: 400,
        message: "Incorrect Password!",
      });
    }

    // session base authentication
    // req.session.isAuth = true;
    // req.session.user = {
    //   userId: userDb._id,
    //   email: userDb.email,
    //   username: userDb.username,
    // };

    // token base authentication
    const payload = {
      name: userDb.name,
      username: userDb.username,
      email: userDb.email,
      userId: userDb._id,
    };

    const token = await jwt.sign(payload, process.env.SECRET_KEY);

    return res.send({
      status: 200,
      message: "Login successful",
      data: { token },
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

// authRouter.post("/logout", isAuth, (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.send({
//         status: 500,
//         message: "Logout unsuccessful",
//         error: err,
//       });
//     }
//     return res.send({
//       status: 200,
//       message: "Logout successful",
//     });
//   });
// });

authRouter.get("/get-all-users", isAuth, async (req, res) => {
  const userId = req.locals.userId;
  try {
    const userList = await User.findUsers({ userId });
    return res.send({
      status: 200,
      message: "AllUserList Read success",
      data: userList,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Database Error",
      error: error,
    });
  }
});

module.exports = authRouter;

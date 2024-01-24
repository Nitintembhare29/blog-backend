const express = require("express");
const clc = require("cli-color");
require("dotenv").config();
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);

// imports
const db = require("./db");
const authRouter = require("./Controllers/authController");
const blogRouter = require("./Controllers/blogController");
const followRouter = require("./Controllers/followController");
const isAuth = require("./Middlewares/authMiddleware");
const cors = require("cors");

// constants
const app = express();
const PORT = process.env.PORT || 8000;
const store = new mongoDbSession({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// router
app.use("/auth", authRouter);
app.use("/blog", isAuth, blogRouter);
app.use("/follow", isAuth, followRouter);

app.listen(PORT, () => {
  console.log(clc.yellowBright.underline(`Server is running on port:${PORT}`));
});

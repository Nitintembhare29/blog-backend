const followSchema = require("../Schemas/followSchema");
const userSchema = require("../Schemas/userSchema");
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectId;

const User = class {
  name;
  email;
  username;
  password;

  constructor({ name, username, email, password }) {
    this.name = name;
    this.username = username;
    this.email = email;
    this.password = password;
  }

  registerUser() {
    return new Promise(async (resolve, reject) => {
      const hashedPassword = await bcrypt.hash(
        this.password,
        parseInt(process.env.SALT)
      );
      const userObj = new userSchema({
        name: this.name,
        username: this.username,
        email: this.email,
        password: hashedPassword,
      });
      try {
        const userDb = await userObj.save();
        resolve(userDb);
      } catch (error) {
        reject(error);
      }
    });
  }
  static findUsernameAndEmailExist({ email, username }) {
    return new Promise(async (resolve, reject) => {
      try {
        const userExist = await userSchema.findOne({
          $or: [{ email }, { username }],
        });

        if (userExist && userExist.email === email) {
          reject("Email already in use!");
        } else if (userExist && userExist.username === username) {
          reject("Username already in use!");
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  static findUserEmailOrUsername({ loginId }) {
    return new Promise(async (resolve, reject) => {
      try {
        const userDb = await userSchema.findOne({
          $or: [{ email: loginId }, { username: loginId }],
        });
        if (!userDb) {
          reject("User does not exist, Please register first");
        }
        resolve(userDb);
      } catch (error) {
        reject(error);
      }
    });
  }

  static verifyUserId({ userId }) {
    return new Promise((resolve, reject) => {
      if (!ObjectId.isValid(userId)) reject("Invalid userId");

      try {
        const userDb = userSchema.findOne({ _id: userId });
        if (!userDb) reject(`No user found with userId: ${userId}`);
        resolve(userDb);
      } catch (error) {
        reject(error);
      }
    });
  }

  static findUsers({ userId }) {
    return new Promise(async (resolve, reject) => {
      try {
        const usersData = await userSchema.find({ _id: { $ne: userId } });
        if (!usersData) reject("Failed to fetch all users");

        const followingDb = await followSchema.aggregate([
          {
            $match: { followerUserId: new ObjectId(userId) },
          },
        ]);

        let userList = [];

        let followingMap = new Map();

        followingDb.map((user) => {
          followingMap.set(user.followingUserId.toString(), true);
        });

        usersData.map((user) => {
          if (followingMap.get(user._id.toString())) {
            let userObj = {
              name: user.name,
              username: user.username,
              _id: user._id,
              email: user.email,
              follow: true,
            };
            userList.push(userObj);
          } else {
            let userObj = {
              name: user.name,
              username: user.username,
              _id: user._id,
              email: user.email,
              follow: false,
            };
            userList.push(userObj);
          }
        });
        resolve(userList);
      } catch (err) {
        reject(err);
      }
    });
  }
};

module.exports = User;

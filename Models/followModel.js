const followSchema = require("../Schemas/followSchema");
const userSchema = require("../Schemas/userSchema");
const ObjectId = require("mongodb").ObjectId;

const followUser = ({ followerUserId, followingUserId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // check for user already following or not
      const followExist = await followSchema.findOne({
        followerUserId,
        followingUserId,
      });
      if (followExist) {
        return reject("Already following the User");
      }

      // create an entry in Db
      const followObj = new followSchema({
        followerUserId,
        followingUserId,
        creationDateTime: Date.now(),
      });

      const followDb = await followObj.save();
      resolve(followDb);
    } catch (error) {
      reject(error);
    }
  });
};

const followerUserList = ({ followingUserId, SKIP, LIMIT }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // we can db with find() but we can't perform other function
      //  const db = await followSchema.find({followingUserId})

      const followerDb = await followSchema.aggregate([
        {
          $match: { followingUserId: new ObjectId(followingUserId) },
        },
        {
          $sort: { creationDateTime: -1 },
        },
        {
          $facet: {
            data: [{ $skip: SKIP }, { $limit: LIMIT }],
          },
        },
      ]);

      //   resolve(followerDb[0].data)

      // In above method insted getting follower UserId but we want follower's details like name
      // populate takes key

      //   const followerDb = await followSchema
      //     .find({ followingUserId })
      //     .populate("followerUserId")
      //     .sort({ creationDateTime: -1 });

      // get all ids of follower
      let followerUserIds = [];
      followerDb[0].data.map((obj) => {
        followerUserIds.push(obj.followerUserId);
      });

      const followerUserDetails = await userSchema.aggregate([
        {
          $match: { _id: { $in: followerUserIds } },
        },
      ]);

      resolve(followerUserDetails.reverse());
    } catch (error) {
      reject(error);
    }
  });
};

const followingUserList = ({ followerUserId, SKIP, LIMIT }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const followingDb = await followSchema.aggregate([
        {
          $match: { followerUserId: new ObjectId(followerUserId) },
        },
        {
          $sort: { creationDateTime: -1 },
        },
        {
          $facet: {
            data: [{ $skip: SKIP }, { $limit: LIMIT }],
          },
        },
      ]);

      // get all ids of following
      let followingUserIds = [];
      followingDb[0].data.map((obj) => {
        followingUserIds.push(obj.followingUserId);
      });

      const followingUserDetails = await userSchema.aggregate([
        {
          $match: { _id: { $in: followingUserIds } },
        },
      ]);

      resolve(followingUserDetails.reverse());
    } catch (error) {
      reject(error);
    }
  });
};

const nonFollowingUserList = ({ followerUserId, SKIP, LIMIT }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const followingDb = await followSchema.aggregate([
        {
          $match: { followerUserId: new ObjectId(followerUserId) },
        },
        {
          $sort: { creationDateTime: -1 },
        },
        {
          $facet: {
            data: [{ $skip: SKIP }, { $limit: LIMIT }],
          },
        },
      ]);

      // get all ids of following
      let followingUserIds = [];
      followingDb[0].data.map((obj) => {
        followingUserIds.push(obj.followingUserId);
      });

      const nonFollowingUserDetails = await userSchema.aggregate([
        {
          $match: { _id: { $ne: followingUserIds } },
        },
      ]);

      const nonFollowingList = nonFollowingUserDetails.filter((obj) => {
        return obj._id != followerUserId;
      });

      resolve(nonFollowingList.reverse());
    } catch (error) {
      reject(error);
    }
  });
};

const unfollowUser = ({ followerUserId, followingUserId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const unfollowDb = await followSchema.findOneAndDelete({
        followerUserId,
        followingUserId,
      });
      resolve(unfollowDb);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  followUser,
  followerUserList,
  followingUserList,
  nonFollowingUserList,
  unfollowUser,
};

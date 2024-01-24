const blogSchema = require("../Schemas/blogSchema");
const ObjectId = require("mongodb").ObjectId;

const Blog = class {
  title;
  textBody;
  userId;
  creationDateTime;
  blogId;

  constructor({ title, textBody, userId, creationDateTime, blogId }) {
    this.title = title;
    this.textBody = textBody;
    this.userId = userId;
    this.creationDateTime = creationDateTime;
    this.blogId = blogId;
  }

  createBlog() {
    return new Promise(async (resolve, reject) => {
      this.title.trim();
      this.textBody.trim();

      const blog = new blogSchema({
        title: this.title,
        textBody: this.textBody,
        userId: this.userId,
        creationDateTime: this.creationDateTime,
      });

      try {
        const blogDb = await blog.save();
        resolve(blogDb);
      } catch (error) {
        reject(error);
      }
    });
  }

  static getBlog({ followingUserIds, SKIP, LIMIT }) {
    return new Promise(async (resolve, reject) => {
      try {
        const blogDb = await blogSchema.aggregate([
          {
            $match: {
              userId: { $in: followingUserIds },
              isDeleted: { $ne: true },
            },
          },
          {
            $sort: { creationDateTime: -1 }, //DESC order of time
          },
          {
            $facet: {
              data: [{ $skip: SKIP }, { $limit: LIMIT }],
            },
          },
        ]);
        resolve(blogDb[0].data);
      } catch (error) {
        reject(error);
      }
    });
  }

  static myBlog({ SKIP, LIMIT, userId }) {
    return new Promise(async (resolve, reject) => {
      try {
        // isDelted => if in 10000 blogs only 1000 are deleted then we will have to serch for
        // 9000 blogs  so use $ne : true and it will not include blog with isDeleted : true
        // match, sort, pagination
        const myblogDb = await blogSchema.aggregate([
          {
            $match: { userId: new ObjectId(userId), isDeleted: { $ne: true } },
          },
          {
            $sort: { creationDateTime: -1 }, // descending order of time
          },
          {
            $facet: {
              data: [{ $limit: LIMIT }, { $skip: SKIP }],
            },
          },
        ]);
        resolve(myblogDb[0].data);
      } catch (error) {
        reject(error);
      }
    });
  }

  static getBlogWithId({ blogId }) {
    return new Promise(async (resolve, reject) => {
      try {
        const blogDb = await blogSchema.findOne({ _id: blogId });

        if (!blogDb) reject("Blog not found");

        resolve(blogDb);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateBlog() {
    return new Promise(async (resolve, reject) => {
      const newBlogData = {};

      if (this.title) {
        newBlogData.title = this.title;
      }

      if (this.textBody) {
        newBlogData.textBody = this.textBody;
      }

      try {
        const oldBlogDb = await blogSchema.findOneAndUpdate(
          { _id: this.blogId },
          newBlogData
        );

        resolve(oldBlogDb);
      } catch (error) {
        reject(error);
      }
    });
  }

  static deleteBlog({ blogId }) {
    return new Promise(async (resolve, reject) => {
      try {
        // const deletedBlog = await blogSchema.findOneAndDelete({ _id: blogId });

        const deletedBlog = await blogSchema.findOneAndUpdate(
          { _id: blogId },
          { isDeleted: true, deletionDateTime: Date.now() }
        );
        resolve(deletedBlog);
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = Blog;

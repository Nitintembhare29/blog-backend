const jwt = require("jsonwebtoken");

const isAuth = (req, res, next) => {
  // if (req.session.isAuth) {
  //   next();
  // } else {
  //   return res.send({
  //     status: 401,
  //     message: "Session expires, please login again",
  //   });
  // }

  const token = req.headers["x-acciojob"];

  let verified;
  try {
    verified = jwt.verify(token, process.env.SECRET_KEY);
    if (verified) {
      req.locals = verified;
    }
    next();
  } catch (err) {
    return res.send({
      status: 401,
      message: "JWT not verified, Please login",
      data: err,
    });
  }
};

module.exports = isAuth;

// req.locals() = It is used to store local variables within the scope of a single
//request-response cycle.
// It's lifespan is only the  duration of that specific request
// useful for passing information between middleware functions or from middleware to route handlers.

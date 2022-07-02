const { checkToken } = require('../helpers/jwt');
const User = require('../models/user');

const throwUnauthError = () => {
  const error = new Error('Авторизуйся');
  error.statusCode = 401;
  throw error;
};

const isAuth = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth) {
    throwUnauthError();
  }

  const token = auth.replace('Bearer ', '');

  try {
    const payload = checkToken(token);

    User.findOne({ email: payload.email })
      .then((user) => {
        if (!user) {
          throwUnauthError();
        }

        req.user = { user };

        next();
      });
  } catch (err) {
    throwUnauthError();
  }
};

module.exports = { isAuth };

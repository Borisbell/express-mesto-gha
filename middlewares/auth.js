const { checkToken } = require('../helpers/jwt');
const User = require('../models/user');

const isAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  console.log('isAuth: ', auth);

  if (!auth) {
    return res.status(401).send({ message: 'Авторизуйся' });
  }

  const token = auth.replace('Bearer ', '');

  try {
    const payload = checkToken(token);

    User.findOne({ email: payload.email })
      .then((user) => {
        if (!user) {
          return res.status(401).send({ message: 'Авторизуйся' });
        }

        req.user = { user };
        next();
      })
      .catch(() => res.status(500).send({ message: 'что-то не так внутри авторизации' }));
  } catch (err) {
    return res.status(401).send({ message: 'Авторизуйся' });
  }
};

module.exports = { isAuth };

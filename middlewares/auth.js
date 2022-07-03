const { checkToken } = require('../helpers/jwt');
const UnAuthError = require('../errors/UnAuthError');

const isAuth = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    throw new UnAuthError('Необходима авторизация');
  }

  const token = auth.replace('Bearer ', '');
  let payload;
  try {
    payload = checkToken(token);
  } catch (err) {
    throw new UnAuthError('Необходима авторизация');
  }
  req.user = payload;
  next();
};

module.exports = { isAuth };

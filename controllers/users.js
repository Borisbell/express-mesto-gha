const bcrypt = require('bcrypt');
const { generateToken } = require('../helpers/jwt');
const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const UnAuthError = require('../errors/UnAuthError');

const MONGO_DUPLICATE_ERROR_CODE = 11000;
const SALT_ROUNDS = 10;

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((users) => {
      res.send(users);
    })
    .catch(next);
};

module.exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .orFail(new Error('NotFound'))
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        throw new NotFoundError('Пользователь не найден');
      }
      if (err.message === 'CastError' || 'ValidationError') {
        throw new BadRequestError('Некорректные данные');
      }
      throw err;
    })
    .catch(next);
};

module.exports.getMyself = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(new Error('NotFound'))
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.message === 'NotFound') {
        throw new NotFoundError('Пользователь не найден');
      }
      throw err;
    })
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Необходима авторизация');
  }

  bcrypt
    .hash(password, SALT_ROUNDS)
    .then((hash) => User.create({
      name, about, avatar, email, password: hash,
    }))
    .then((user) => {
      res.send({
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        email: user.email,
      });
    })
    .catch((err) => {
      if (err.code === MONGO_DUPLICATE_ERROR_CODE) {
        throw new ConflictError('Это емейл уже занят');
      }
      throw err;
    })
    .catch(next);
};

module.exports.updateUser = (req, res, next) => {
  User.findByIdAndUpdate(req.user._id, { name: req.body.name, about: req.body.about }, {
    new: true,
    runValidators: true,
  })
    .orFail(new Error('NotFound'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        throw new NotFoundError('Пользователь не найден');
      } else if (err.message === 'CastError' || 'ValidationError') {
        throw new BadRequestError('Некорректные данные');
      }
      throw err;
    })
    .catch(next);
};

module.exports.updateUserAvatar = (req, res, next) => {
  User.findByIdAndUpdate(req.user._id, { avatar: req.body.avatar }, {
    new: true,
    runValidators: true,
  })
    .orFail(new Error('NotFound'))
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.message === 'NotFound') {
        throw new NotFoundError('Пользователь не найден');
      }
      if (err.message === 'CastError' || 'ValidationError') {
        throw new BadRequestError('Некорректные данные');
      }
      throw err;
    })
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new UnAuthError('Не передан емейл или пароль');
  }

  User
    .findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        throw new UnAuthError('Не передан емейл или пароль');
      }

      return Promise.all([
        user,
        bcrypt.compare(password, user.password),
      ]);
    })
    .then(([user, isPasswordCorrect]) => {
      if (!isPasswordCorrect) {
        throw new UnAuthError('Не передан емейл или пароль');
      }

      return generateToken({ _id: user._id });
    })
    .then((token) => res.send({ token }))
    .catch(next);
};

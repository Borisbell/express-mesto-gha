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
    .orFail(() => { next(new NotFoundError('Нет пользователя с переданным id')); })
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      if (err.message === 'CastError' || 'ValidationError') {
        next(new BadRequestError('Некорректные данные'));
      } else { next(err); }
    });
};

module.exports.getMyself = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(new Error('NotFound'))
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.message === 'NotFound') {
        next(new NotFoundError('Пользователь не найден'));
      } else { next(err); }
    });
};

module.exports.createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

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
        next(new ConflictError('Это емейл уже занят'));
      } else if (err.message === 'CastError' || 'ValidationError') {
        next(new BadRequestError('Некорректные данные'));
      } else { next(err); }
    });
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
        next(new NotFoundError('Пользователь не найден'));
      } else if (err.message === 'CastError' || 'ValidationError') {
        next(new BadRequestError('Некорректные данные'));
      } else { next(err); }
    });
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
        next(new NotFoundError('Пользователь не найден'));
      } else if (err.message === 'CastError' || 'ValidationError') {
        next(new BadRequestError('Некорректные данные'));
      } else { next(err); }
    });
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  User
    .findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        next(new UnAuthError('Не передан емейл или пароль'));
      }

      return Promise.all([
        user,
        bcrypt.compare(password, user.password),
      ]);
    })
    .then(([user, isPasswordCorrect]) => {
      if (!isPasswordCorrect) {
        next(new UnAuthError('Не передан емейл или пароль'));
      }

      return generateToken({ _id: user._id });
    })
    .then((token) => res.send({ token }))
    .catch(next);
};

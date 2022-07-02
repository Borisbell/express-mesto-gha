const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  NOT_FOUND,
  BAD_REQUEST,
  INTERN_SERVER_ERR,
} = require('../constants');

const MONGO_DUPLICATE_ERROR_CODE = 11000;
const SALT_ROUNDS = 10;
const SECRET_KEY = 'secret_key';
const User = require('../models/user');

module.exports.getUsers = (req, res) => {
  User.find({})
    .then((users) => {
      res.send(users);
    })
    .catch(() => res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' }));
};

module.exports.getUser = (req, res) => {
  User.findById(req.params.id)
    .orFail(new Error('NotFound'))
    .then((user) => {
      res.send({ user });
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Пользователь не найден' });
      } else if (err.message === 'CastError' || 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.getMyself = (req, res) => {
  User.findById(req.user._id)
    .orFail(new Error('NotFound'))
    .then((user) => {
      res.send({ user });
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Пользователь не найден' });
      } else if (err.message === 'CastError' || 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.createUser = (req, res) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      message: 'Не передан емейл или пароль',
    });
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
        return res.status(409).send({ message: 'Емейл занят' });
      }
      return res.status(500).send({ message: 'Что-то не так' });
    });
};

module.exports.updateUser = (req, res) => {
  User.findByIdAndUpdate(req.user._id, { name: req.body.name, about: req.body.about }, {
    new: true,
    runValidators: true,
  })
    .orFail(new Error('NotFound'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Пользователь не найден' });
      } else if (err.message === 'CastError' || 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.updateUserAvatar = (req, res) => {
  User.findByIdAndUpdate(req.user._id, { avatar: req.body.avatar }, {
    new: true,
    runValidators: true,
  })
    .orFail(new Error('NotFound'))
    .then((user) => res.send({ user }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Пользователь не найден' });
      } else if (err.message === 'CastError' || 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректная ссылка' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({
      message: 'Не передан емейл или пароль',
    });
  }

  User
    .findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        const err = new Error('Неправильный Емайл или пароль');
        err.statusCode = 403;
        throw err;
      }

      return Promise.all([
        user,
        bcrypt.compare(password, user.password),
      ]);
    })
    .then(([user, isPasswordCorrect]) => {
      if (!isPasswordCorrect) {
        const err = new Error('Неправильный Емайл или пароль');
        err.statusCode = 403;
        throw err;
      }

      return jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: '7d' });
    })
    .then((token) => res.send({ token }))
    .catch((err) => {
      if (err.statusCode === 403) {
        return res.status(403).send({ message: 'Неправильный Емайл или пароль' });
      }
      return res.status(500).send({ message: 'Что-то пошло не так' });
    });
};

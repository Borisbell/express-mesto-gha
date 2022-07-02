const bcrypt = require('bcrypt');
const { generateToken } = require('../helpers/jwt');
const {
  NOT_FOUND,
  BAD_REQUEST,
  INTERN_SERVER_ERR,
} = require('../constants');

const MONGO_DUPLICATE_ERROR_CODE = 11000;
const SALT_ROUNDS = 10;
const User = require('../models/user');

module.exports.getUsers = (req, res) => {
  console.log('User id: ', req.user.id);

  User.find({})
    .then((users) => {
      res.send(users);
    })
    .catch(() => res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' }));
};

module.exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .orFail(new Error('NotFound'))
    .then((user) => {
      res.send({ user });
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        const error = new Error('Пользователь не найден');
        error.statusCode = NOT_FOUND;
        throw error;
      }
      if (err.message === 'CastError' || 'ValidationError') {
        const error = new Error('Некорректные данные');
        error.statusCode = BAD_REQUEST;
        throw error;
      }
      throw err;
    })
    .catch(next);
};

module.exports.getMyself = (req, res, next) => {
  console.log(req.user);
  User.findById(req.user._id)
    .orFail(new Error('NotFound'))
    .then((user) => {
      console.log(user);
      return res.status(200).send(user);
    })
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

  if (!email || !password) {
    const error = new Error('Авторизуйся');
    error.statusCode = 401;
    throw error;
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
        const error = new Error('Емейл занят');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    })
    .catch(next);
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

module.exports.updateUserAvatar = (req, res, next) => {
  User.findByIdAndUpdate(req.user._id, { avatar: req.body.avatar }, {
    new: true,
    runValidators: true,
  })
    .orFail(new Error('NotFound'))
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.message === 'NotFound') {
        const error = new Error('Пользователь не найден');
        error.statusCode = NOT_FOUND;
        throw error;
      }
      if (err.message === 'CastError' || 'ValidationError') {
        const error = new Error('Некорректные данные');
        error.statusCode = BAD_REQUEST;
        throw error;
      }
      throw err;
    })
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error('Не передан емейл или пароль');
    error.statusCode = 401;
    throw error;
  }

  User
    .findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        const err = new Error('Неправильный Емайл или пароль');
        err.statusCode = 401;
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
        err.statusCode = 401;
        throw err;
      }

      return generateToken({ _id: user._id });
    })
    .then((token) => res.send({ token }))
    .catch(next);
};

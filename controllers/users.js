const User = require('../models/user');

const NOT_FOUND = 404;
const BAD_REQUEST = 400;
const INTERN_SERVER_ERR = 500;

module.exports.getUsers = (req, res) => {
  User.find({})
    .then((users) => {
      res.status(200).send(users);
    })
    .catch(() => res.status(NOT_FOUND).send({ message: 'Произошла ошибка' }));
};

module.exports.getUser = (req, res) => {
  User.findById(req.params.id)
    .orFail(new Error('NotFound'))
    .then((user) => {
      res.status(200).send({ user });
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Пользователь не найден' });
      } else if (err.message === 'CastError' || err.message === 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.createUser = (req, res) => {
  const { name, about, avatar } = req.body;
  User.create({ name, about, avatar })
    .then((user) => res.status(201).send(user))
    .catch((err) => {
      if (err.message === 'CastError' || 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Ошибка сервера' });
      }
    });
};

module.exports.updateUser = (req, res) => {
  User.findByIdAndUpdate(req.user._id, { name: req.body.name, about: req.body.about }, {
    new: true,
    runValidators: true,
    upsert: false,
  })
    .orFail(new Error('CastError'))
    .then((user) => res.status(200).send({ data: user }))
    .catch((err) => {
      if (err.message === 'CastError' || 'ValidationError') {
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
    upsert: false,
  })
    .orFail(new Error('CastError'))
    .then((user) => res.status(200).send({ user }))
    .catch((err) => {
      if (err.message === 'CastError' || err.message === 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректная ссылка' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Произошла ошибка' });
      }
    });
};

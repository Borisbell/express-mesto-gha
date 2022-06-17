const Card = require('../models/card');

const NOT_FOUND = 404;
const BAD_REQUEST = 400;
const INTERN_SERVER_ERR = 500;

module.exports.getCards = (req, res) => {
  Card.find({})
    .then((cards) => {
      res.status(200).send(cards);
    })
    .catch(() => res.status(NOT_FOUND).send({ message: 'Ошибка сервера' }));
};

module.exports.createCard = (req, res) => {
  const { name, link } = req.body;
  const owner = req.user._id;
  Card.create({ name, link, owner })
    .then((card) => {
      if (!card) {
        res.status(BAD_REQUEST).send({ message: 'Неверные данные' });
      }
      res.status(201).send(card);
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Id карточки не найден' });
      } else if (err.message === 'CastError' || err.message === 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Ошибка сервера' });
      }
    });
};

module.exports.deleteCard = (req, res) => {
  Card.findByIdAndRemove(req.params.cardId)
    .orFail(new Error('NotFound'))
    .then((card) => res.send({ card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Id карточки не найден' });
      } else if (err.message === 'CastError' || err.message === 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Ошибка сервера' });
      }
    });
};

module.exports.likeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new Error('NotFound'))
    .then((card) => res.status(200).send({ card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Id карточки не найден' });
      } else if (err.message === 'CastError' || err.message === 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Ошибка сервера' });
      }
    });
};

module.exports.dislikeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new Error('NotFound'))
    .then((card) => res.status(200).send({ card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(NOT_FOUND).send({ message: 'Id карточки не найден' });
      } else if (err.message === 'CastError' || err.message === 'ValidationError') {
        res.status(BAD_REQUEST).send({ message: 'Некорректные данные' });
      } else {
        res.status(INTERN_SERVER_ERR).send({ message: 'Ошибка сервера' });
      }
    });
};

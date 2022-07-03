const {
  NOT_FOUND,
  BAD_REQUEST,
  FORBIDDEN_ERR,
  INTERN_SERVER_ERR,
} = require('../constants');

const Card = require('../models/card');

module.exports.getCards = (req, res) => {
  Card.find({})
    .then((cards) => {
      res.send(cards);
    })
    .catch(() => res.status(INTERN_SERVER_ERR).send({ message: 'Ошибка сервера' }));
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  const owner = req.user._id;
  Card.create({ name, link, owner })
    .then((card) => {
      res.send(card);
    })
    .catch((err) => {
      if (err.message === 'CastError' || 'ValidationError') {
        const error = new Error('Некорректные данные');
        error.statusCode = BAD_REQUEST;
        throw error;
      }
      throw err;
    })
    .catch(next);
};

module.exports.deleteCard = (req, res, next) => {
  Card.findById(req.params.cardId)
    .orFail(new Error('NotFound'))
    .then((card) => {
      if (card.owner.toString() !== req.user._id) {
        const error = new Error('Нет прав на удаление карточки');
        error.statusCode = FORBIDDEN_ERR;
        throw error;
      }
      Card.findByIdAndRemove(req.params.cardId)
        .then((deletedCard) => res.send(deletedCard))
        .catch(next);
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        const error = new Error('Пользователь не найден');
        error.statusCode = NOT_FOUND;
        throw error;
      }
      throw err;
    })
    .catch(next);
};

module.exports.likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new Error('NotFound'))
    .then((card) => res.send(card))
    .catch((err) => {
      if (err.message === 'NotFound') {
        const error = new Error('Пользователь не найден');
        error.statusCode = NOT_FOUND;
        throw error;
      }
      if (err.message === 'CastError') {
        const error = new Error('Некорректные данные');
        error.statusCode = BAD_REQUEST;
        throw error;
      }
      throw err;
    })
    .catch(next);
};

module.exports.dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new Error('NotFound'))
    .then((card) => res.send({ card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        const error = new Error('Пользователь не найден');
        error.statusCode = NOT_FOUND;
        throw error;
      }
      if (err.message === 'CastError') {
        const error = new Error('Некорректные данные');
        error.statusCode = BAD_REQUEST;
        throw error;
      }
      throw err;
    })
    .catch(next);
};

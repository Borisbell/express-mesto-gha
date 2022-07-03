const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenError = require('../errors/ForbiddenError');

const Card = require('../models/card');

module.exports.getCards = (req, res, next) => {
  Card.find({})
    .then((cards) => {
      res.send(cards);
    })
    .catch(next);
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
        throw new BadRequestError('Некорректные данные');
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
        throw new ForbiddenError('Нет прав на удаление карточки');
      }
      return Card.findByIdAndRemove(req.params.cardId)
        .then((deletedCard) => res.send(deletedCard))
        .catch(next);
    })
    .catch((err) => {
      if (err.message === 'NotFound') {
        throw new NotFoundError('Пользователь не найден');
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
        throw new NotFoundError('Пользователь не найден');
      }
      if (err.message === 'CastError') {
        throw new BadRequestError('Некорректные данные');
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
        throw new NotFoundError('Пользователь не найден');
      }
      if (err.message === 'CastError') {
        throw new BadRequestError('Некорректные данные');
      }
      throw err;
    })
    .catch(next);
};

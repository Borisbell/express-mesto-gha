const Card = require('../models/card');

module.exports.getCards = (req, res) => {
  Card.find({}).then((cards) => {
    res.status(200).send(cards);
  })
    .catch(() => res.status(404).send({ message: 'Произошла ошибка' }));
};

module.exports.createCard = (req, res) => {
  const { name, link } = req.body;
  const owner = req.user._id;
  Card.create({ name, link, owner })
    .orFail(new Error('CastError'))
    .then((card) => {
      res.status(201).send(card);
    })
    .catch((err) => {
      if (err.message === 'CastError' || 'ValidationError') {
        res.status(400).send({ message: 'Некорректные данные' });
      } else {
        res.status(500).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.deleteCard = (req, res) => {
  Card.findByIdAndRemove(req.params.id)
    .then((card) => res.send({ data: card }))
    .catch(() => res.status(500).send({ message: 'Произошла ошибка' }));
};

module.exports.likeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new Error('CastError'))
    .then((card) => res.status(200).send({ data: card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(404).send({ message: 'Id карточки не найден' });
      } else if (err.message === 'CastError' || 'ValidationError') {
        res.status(400).send({ message: 'Некорректные данные' });
      } else {
        res.status(500).send({ message: 'Произошла ошибка' });
      }
    });
};

module.exports.dislikeCard = (req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .orFail(new Error('CastError'))
    .then((card) => res.status(200).send({ data: card }))
    .catch((err) => {
      if (err.message === 'NotFound') {
        res.status(404).send({ message: 'Id карточки не найден' });
      } else if (err.message === 'CastError' || 'ValidationError') {
        res.status(400).send({ message: 'Некорректные данные' });
      } else {
        res.status(500).send({ message: 'Произошла ошибка' });
      }
    });
};

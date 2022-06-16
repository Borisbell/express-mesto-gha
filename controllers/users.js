const User = require('../models/user');

module.exports.getUsers = (req, res) => {
  User.find({})
    .then((users) => {
      res.status(200).send(users);
    })
    .catch(() => res.status(404).send({ message: 'Произошла ошибка' }));
};

module.exports.getUser = (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      res.status(200).send({ user });
    })
    .catch(() => res.status(404).send({ message: 'Произошла ошибка' }));
};

module.exports.createUser = (req, res) => {
  const { name, about, avatar } = req.body;
  User.create({ name, about, avatar })
    .then((user) => res.status(201).send(user))
    .catch(() => res.status(400).send({ message: 'Произошла ошибка' }));
};

module.exports.updateUser = (req, res) => {
  User.findByIdAndUpdate(req.params.id, { name: res.name }, {
    new: true,
    runValidators: true,
    upsert: false,
  })
    .then((user) => res.status(200).send({ user }))
    .catch((err) => res.status(500).send({ message: 'Произошла ошибка' }));
};

module.exports.updateUserAvatar = (req, res) => {
  User.findByIdAndUpdate(req.params.id, { avatar: res.avatar }, {
    new: true,
    runValidators: true,
    upsert: false,
  })
    .then((user) => res.status(200).send({ user }))
    .catch((err) => res.status(500).send({ message: 'Произошла ошибка' }));
};

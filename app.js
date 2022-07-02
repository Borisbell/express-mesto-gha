const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { celebrate, Joi, errors } = require('celebrate');
const usersRouter = require('./routes/users');
const cardsRouter = require('./routes/cards');
const { login, createUser } = require('./controllers/users');

const { isAuth } = require('./middlewares/auth');

const { TEST_AVA_LINK } = require('./constants');

const app = express();
const { PORT = 3000 } = process.env;

mongoose.connect('mongodb://localhost:27017/mestodb');

app.use(bodyParser.json());

app.post('/signin', celebrate({
  body: Joi.object().keys({
    password: Joi.string().required().min(8),
    email: Joi.string().required().email(),
  }),
}), login);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    avatar: Joi.string().regex(TEST_AVA_LINK),
    password: Joi.string().required().min(8),
    email: Joi.string().required().email(),
  }),
}), createUser);

app.use('/users', isAuth, usersRouter);
app.use('/cards', isAuth, cardsRouter);

app.use('*', (req, res) => {
  res.status(404).send({ message: 'Страницы не существует' });
});

app.use(errors());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.statusCode) {
    return res.status(err.statusCode).send({ message: err.message });
  }

  console.error(err.stack);

  res.status(500).send({ message: 'Что-то пошло не так' });
});

app.listen(PORT, () => {
  console.log('works on port', PORT);
});

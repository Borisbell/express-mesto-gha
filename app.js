const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { celebrate, Joi, errors } = require('celebrate');
const usersRouter = require('./routes/users');
const cardsRouter = require('./routes/cards');
const { login, createUser } = require('./controllers/users');
const auth = require('./middlewares/auth');

const app = express();
const { PORT = 3000 } = process.env;

mongoose.connect('mongodb://localhost:27017/mestodb');

app.use(bodyParser.json());
// app.use((req, res, next) => {
//   req.user = {
//     _id: '62aa37992dff57fc10336a83',
//   };

//   next();
// });
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
    avatar: Joi.string(),
    password: Joi.string().required().min(8),
    email: Joi.string().required().email(),
  }),
}), createUser);

app.use(auth);

app.use('/users', usersRouter);
app.use('/cards', cardsRouter);
app.use((req, res) => {
  res.status(404).send({ message: 'Страницы не существует' });
});
app.use(errors());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).send({ message: 'Что-то пошло не так' });
});
app.listen(PORT, () => {
  console.log('works on port', PORT);
});

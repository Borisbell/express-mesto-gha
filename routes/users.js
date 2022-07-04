const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const { validateLink } = require('../helpers/validateLink');
const {
  getUsers,
  getUser,
  getMyself,
  updateUser,
  updateUserAvatar,
} = require('../controllers/users');

router.get('/', getUsers);
router.get('/me', getMyself);
router.get(
  '/:id',
  celebrate({
    params: Joi.object().keys({
      id: Joi.string().length(24).hex().required(),
    }),
  }),
  getUser,
);

router.patch(
  '/me',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(30),
      about: Joi.string().min(2).max(30),
    }),
  }),
  updateUser,
);

router.patch(
  '/me/avatar',
  celebrate({
    body: Joi.object().keys({
      avatar: Joi.string().custom(validateLink),
    }),
  }),
  updateUserAvatar,
);

module.exports = router;

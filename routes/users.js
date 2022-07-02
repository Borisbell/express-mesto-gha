const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  getUsers,
  getUser,
  getMyself,
  updateUser,
  updateUserAvatar,
} = require('../controllers/users');
const { TEST_LINK } = require('../constants');

router.get('/', getUsers);
router.get('/me', getMyself);
router.get(
  '/:id',
  celebrate({
    params: Joi.object().keys({
      userId: Joi.string().alphanum().length(24),
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
      avatar: Joi.string().regex(TEST_LINK),
    }),
  }),
  updateUserAvatar,
);

module.exports = router;

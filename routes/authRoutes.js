const express = require('express');
const { validate } = require('../middleware/validateRequest');
const { protect, restrictTo } = require('../middleware/auth');
const Joi = require('joi');
const {
  registerCompany,
  login,
  getMe,
  updatePassword
} = require('../controllers/authController');

const router = express.Router();

// مخططات التحقق
const companyRegisterSchema = Joi.object({
  nationalId: Joi.string().pattern(/^\d{10}$/).required().messages({
    'string.pattern.base': 'National ID must be 10 digits'
  }),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  location: Joi.string().required(),
  fieldOfWork: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string().required(),
  universityId: Joi.string().pattern(/^\d{7}$/),
  nationalId: Joi.string().pattern(/^\d{10}$/)
}).xor('email', 'universityId', 'nationalId').messages({
  'object.xor': 'Please provide either email, university ID, or national ID'
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// المسارات
router.post('/register/company', validate(companyRegisterSchema), registerCompany);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
//router.put('/updatepassword', protect, validate(updatePasswordSchema), updatePassword);
router.put('/updatepassword', protect, restrictTo('company'), validate(updatePasswordSchema), updatePassword);


module.exports = router;
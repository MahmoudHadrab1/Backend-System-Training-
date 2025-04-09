const express = require('express');
const { validate } = require('../middleware/validateRequest');
const { protect, restrictTo } = require('../middleware/auth');
const Joi = require('joi');
const {
  createTrainingPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost
} = require('../controllers/trainingPostController');

const router = express.Router();

// مخططات التحقق
const createPostSchema = Joi.object({
  title: Joi.string().required(),
  duration: Joi.number().valid(6, 8).required(),
  location: Joi.string().required(),
  availableUntil: Joi.date().greater('now').required(),
  description: Joi.string()
});

const updatePostSchema = Joi.object({
  title: Joi.string(),
  duration: Joi.number().valid(6, 8),
  location: Joi.string(),
  availableUntil: Joi.date().greater('now'),
  description: Joi.string()
}).min(1);

// المسارات العامة
router.get('/', getAllPosts);
router.get('/:id', getPost);

// المسارات المحمية
router.use(protect);

// مسارات الشركة
router.post('/', restrictTo('company'), validate(createPostSchema), createTrainingPost);
router.put('/:id', restrictTo('company'), validate(updatePostSchema), updatePost);
router.delete('/:id', restrictTo('company'), deletePost);

module.exports = router;
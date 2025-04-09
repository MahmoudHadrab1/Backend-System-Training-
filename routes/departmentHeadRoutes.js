const express = require('express');
const { validate } = require('../middleware/validateRequest');
const { protect, restrictTo } = require('../middleware/auth');
const Joi = require('joi');
const {
  getDepartmentStudents,
  getPendingTrainingPosts,
  reviewTrainingPost,
  getPendingApplications,
  submitOfficialDocument
} = require('../controllers/departmentHeadController');

const router = express.Router();

// مخططات التحقق
const reviewPostSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required()
});

const submitDocumentSchema = Joi.object({
  documentContent: Joi.string().required()
});

// حماية جميع المسارات
router.use(protect);
router.use(restrictTo('department-head'));

// مسارات رئيس القسم
router.get('/students', getDepartmentStudents);
router.get('/posts/pending', getPendingTrainingPosts);
router.put('/posts/:id/review', validate(reviewPostSchema), reviewTrainingPost);
router.get('/applications/pending', getPendingApplications);
router.post('/applications/:id/document', validate(submitDocumentSchema), submitOfficialDocument);

module.exports = router;
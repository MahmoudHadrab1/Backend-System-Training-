const express = require('express');
const { validate } = require('../middleware/validateRequest');
const { protect, restrictTo } = require('../middleware/auth');
const Joi = require('joi');
const {
  getCompanies,
  getCompany,
  updateProfile,
  getCompanyPosts,
  getCompanyApplications,
  updateApplicationStatus,
  submitApprovalFiles,
  submitActivityReport
} = require('../controllers/companyController');

const router = express.Router();

// مخططات التحقق
const updateProfileSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string(),
  location: Joi.string(),
  fieldOfWork: Joi.string()
});

const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required()
});

const submitFileSchema = Joi.object({
  fileContent: Joi.string().required()
});

// حماية جميع المسارات
router.use(protect);

// مسارات المسؤول
router.get('/', restrictTo('admin'), getCompanies);
router.get('/:id', restrictTo('admin'), getCompany);

// مسارات الشركة
router.put('/profile', restrictTo('company'), validate(updateProfileSchema), updateProfile);
router.get('/posts', restrictTo('company'), getCompanyPosts);
router.get('/applications', restrictTo('company'), getCompanyApplications);
router.put('/applications/:id', restrictTo('company'), validate(updateApplicationStatusSchema), updateApplicationStatus);
router.post('/applications/:id/approval', restrictTo('company'), validate(submitFileSchema), submitApprovalFiles);
router.post('/applications/:id/activity', restrictTo('company'), validate(submitFileSchema), submitActivityReport);

module.exports = router;
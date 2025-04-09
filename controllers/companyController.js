const Company = require('../models/Company');
const User = require('../models/User');
const TrainingPost = require('../models/TrainingPost');
const Application = require('../models/Application');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    الحصول على جميع الشركات
// @route   GET /api/companies
// @access  Private/Admin
exports.getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().populate('user', 'email');
    
    ApiResponse.success(res, 'Companies retrieved successfully', { count: companies.length, companies });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على شركة واحدة
// @route   GET /api/companies/:id
// @access  Private/Admin
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate('user', 'email');
    
    if (!company) {
      return next(new ApiError(404, 'Company not found'));
    }
    
    ApiResponse.success(res, 'Company retrieved successfully', { company });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث ملف تعريف الشركة
// @route   PUT /api/companies/profile
// @access  Private/Company
exports.updateProfile = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to update company profile'));
    }
    
    const { name, phone, location, fieldOfWork } = req.body;
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // تحديث الحقول إذا تم توفيرها
    if (name) company.name = name;
    if (phone) company.phone = phone;
    if (location) company.location = location;
    if (fieldOfWork) company.fieldOfWork = fieldOfWork;
    
    await company.save();
    
    logger.info(`Company profile updated: ${company.name} (${company.nationalId})`);
    
    ApiResponse.success(res, 'Company profile updated successfully', { company });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على إعلانات التدريب حسب الشركة
// @route   GET /api/companies/posts
// @access  Private/Company
exports.getCompanyPosts = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to access company posts'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    const posts = await TrainingPost.find({ company: company._id })
      .sort({ createdAt: -1 });
    
    ApiResponse.success(res, 'Training posts retrieved successfully', { count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على جميع الطلبات لإعلانات تدريب الشركة
// @route   GET /api/companies/applications
// @access  Private/Company
exports.getCompanyApplications = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to access company applications'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // الحصول على جميع إعلانات التدريب من هذه الشركة
    const posts = await TrainingPost.find({ company: company._id });
    const postIds = posts.map(post => post._id);
    
    // الحصول على جميع الطلبات لهذه الإعلانات
    const applications = await Application.find({ trainingPost: { $in: postIds } })
      .populate({
        path: 'student',
        select: 'name universityId department'
      })
      .populate({
        path: 'trainingPost',
        select: 'title duration'
      })
      .sort({ createdAt: -1 });
    
    ApiResponse.success(res, 'Applications retrieved successfully', { count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث حالة الطلب (موافقة/رفض)
// @route   PUT /api/companies/applications/:id
// @access  Private/Company
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // التحقق من الحالة
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return next(new ApiError(400, 'Status must be either APPROVED or REJECTED'));
    }
    
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to update application status'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // البحث عن الطلب
    const application = await Application.findById(req.params.id)
      .populate('trainingPost');
    
    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }
    
    // التأكد من أن الطلب لإعلان من هذه الشركة
    const post = await TrainingPost.findById(application.trainingPost);
    
    if (post.company.toString() !== company._id.toString()) {
      return next(new ApiError(403, 'Not authorized to update this application'));
    }
    
    // تحديث حالة الطلب
    application.status = status;
    application.updatedAt = Date.now();
    await application.save();
    
    logger.info(`Company ${company.name} ${status === 'APPROVED' ? 'approved' : 'rejected'} application ${application._id}`);
    
    ApiResponse.success(res, 'Application status updated successfully', { application });
  } catch (error) {
    next(error);
  }
};

// @desc    تقديم ملفات الموافقة للتدريب
// @route   POST /api/companies/applications/:id/approval
// @access  Private/Company
exports.submitApprovalFiles = async (req, res, next) => {
  try {
    const { fileContent } = req.body;
    
    if (!fileContent) {
      return next(new ApiError(400, 'Approval file content is required'));
    }
    
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to submit approval files'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // البحث عن الطلب
    const application = await Application.findById(req.params.id)
      .populate('trainingPost');
    
    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }
    
    // التأكد من أن الطلب لإعلان من هذه الشركة
    const post = await TrainingPost.findById(application.trainingPost);
    
    if (post.company.toString() !== company._id.toString()) {
      return next(new ApiError(403, 'Not authorized to submit files for this application'));
    }
    
    // التأكد من أن الطلب تمت الموافقة عليه
    if (application.status !== 'APPROVED') {
      return next(new ApiError(400, 'Cannot submit approval files for an application that is not approved'));
    }
    
    // حفظ ملف الموافقة (في نظام حقيقي، سيتم تخزين مسار الملف)
    const approvalFilePath = `uploads/approvals/${application._id}_${Date.now()}.txt`;
    
    application.approvalFiles.push(approvalFilePath);
    application.updatedAt = Date.now();
    await application.save();
    
    // تحديث حالة الطالب إلى WAITING_FOR_APPROVAL إذا كان هذا هو أول ملف موافقة
    if (application.approvalFiles.length === 1) {
      const student = await Student.findById(application.student);
      student.trainingStatus = 'WAITING_FOR_APPROVAL';
      await student.save();
    }
    
    logger.info(`Company ${company.name} submitted approval file for application ${application._id}`);
    
    ApiResponse.success(res, 'Approval file submitted successfully', { application });
  } catch (error) {
    next(error);
  }
};

// @desc    تقديم تقرير نشاط للتدريب
// @route   POST /api/companies/applications/:id/activity
// @access  Private/Company
exports.submitActivityReport = async (req, res, next) => {
  try {
    const { reportContent } = req.body;
    
    if (!reportContent) {
      return next(new ApiError(400, 'Activity report content is required'));
    }
    
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to submit activity reports'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // البحث عن الطلب
    const application = await Application.findById(req.params.id)
      .populate('trainingPost');
    
    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }
    
    // التأكد من أن الطلب لإعلان من هذه الشركة
    const post = await TrainingPost.findById(application.trainingPost);
    
    if (post.company.toString() !== company._id.toString()) {
      return next(new ApiError(403, 'Not authorized to submit reports for this application'));
    }
    
    // التأكد من أن الطالب في التدريب
    const student = await Student.findById(application.student);
    
    if (student.trainingStatus !== 'IN_TRAINING') {
      return next(new ApiError(400, 'Cannot submit activity report. Student is not currently in training.'));
    }
    
    // حفظ تقرير النشاط (في نظام حقيقي، سيتم تخزين مسار الملف)
    const reportFilePath = `uploads/activities/${application._id}_${Date.now()}.txt`;
    
    application.activityReports.push(reportFilePath);
    application.updatedAt = Date.now();
    await application.save();
    
    logger.info(`Company ${company.name} submitted activity report for application ${application._id}`);
    
    ApiResponse.success(res, 'Activity report submitted successfully', { application });
  } catch (error) {
    next(error);
  }
};
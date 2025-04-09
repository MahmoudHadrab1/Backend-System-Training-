const DepartmentHead = require('../models/DepartmentHead');
const User = require('../models/User');
const Student = require('../models/Student');
const TrainingPost = require('../models/TrainingPost');
const Application = require('../models/Application');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    الحصول على الطلاب حسب القسم
// @route   GET /api/department-heads/students
// @access  Private/DepartmentHead
exports.getDepartmentStudents = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم المسجل الدخول هو رئيس قسم
    if (req.user.role !== 'department-head') {
      return next(new ApiError(403, 'Not authorized to access department head resources'));
    }
    
    const departmentHead = await DepartmentHead.findOne({ user: req.user.id });
    
    if (!departmentHead) {
      return next(new ApiError(404, 'Department head profile not found'));
    }
    
    // الحصول على جميع الطلاب في هذا القسم
    const students = await Student.find({ department: departmentHead.department })
      .sort({ name: 1 });
    
    ApiResponse.success(res, 'Department students retrieved successfully', { count: students.length, students });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على إعلانات التدريب المعلقة
// @route   GET /api/department-heads/posts/pending
// @access  Private/DepartmentHead
exports.getPendingTrainingPosts = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم المسجل الدخول هو رئيس قسم
    if (req.user.role !== 'department-head') {
      return next(new ApiError(403, 'Not authorized to access department head resources'));
    }
    
    const departmentHead = await DepartmentHead.findOne({ user: req.user.id });
    
    if (!departmentHead) {
      return next(new ApiError(404, 'Department head profile not found'));
    }
    
    // الحصول على جميع إعلانات التدريب المعلقة
    const posts = await TrainingPost.find({ status: 'PENDING' })
      .populate({
        path: 'company',
        select: 'name location fieldOfWork'
      })
      .sort({ createdAt: 1 });
    
    ApiResponse.success(res, 'Pending training posts retrieved successfully', { count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};

// @desc    الموافقة أو رفض إعلان التدريب
// @route   PUT /api/department-heads/posts/:id/review
// @access  Private/DepartmentHead
exports.reviewTrainingPost = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // التحقق من الحالة
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return next(new ApiError(400, 'Status must be either APPROVED or REJECTED'));
    }
    
    // التأكد من أن المستخدم المسجل الدخول هو رئيس قسم
    if (req.user.role !== 'department-head') {
      return next(new ApiError(403, 'Not authorized to access department head resources'));
    }
    
    const departmentHead = await DepartmentHead.findOne({ user: req.user.id });
    
    if (!departmentHead) {
      return next(new ApiError(404, 'Department head profile not found'));
    }
    
    // البحث عن إعلان التدريب
    const post = await TrainingPost.findById(req.params.id);
    
    if (!post) {
      return next(new ApiError(404, 'Training post not found'));
    }
    
    // التأكد من أن الإعلان معلق
    if (post.status !== 'PENDING') {
      return next(new ApiError(400, 'This post has already been reviewed'));
    }
    
    // تحديث حالة الإعلان
    post.status = status;
    post.approvedBy = departmentHead._id;
    post.approvedAt = Date.now();
    await post.save();
    
    logger.info(`Department head ${departmentHead.name} ${status === 'APPROVED' ? 'approved' : 'rejected'} training post ${post._id}`);
    
    ApiResponse.success(res, `Training post ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`, { post });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على طلبات الطلاب التي تحتاج إلى وثيقة رسمية
// @route   GET /api/department-heads/applications/pending
// @access  Private/DepartmentHead
exports.getPendingApplications = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم المسجل الدخول هو رئيس قسم
    if (req.user.role !== 'department-head') {
      return next(new ApiError(403, 'Not authorized to access department head resources'));
    }
    
    const departmentHead = await DepartmentHead.findOne({ user: req.user.id });
    
    if (!departmentHead) {
      return next(new ApiError(404, 'Department head profile not found'));
    }
    
    // الحصول على الطلاب في هذا القسم بحالة WAITING_FOR_APPROVAL
    const students = await Student.find({
      department: departmentHead.department,
      trainingStatus: 'WAITING_FOR_APPROVAL'
    });
    
    const studentIds = students.map(student => student._id);
    
    // الحصول على الطلبات المختارة لهؤلاء الطلاب
    const applications = await Application.find({
      student: { $in: studentIds },
      selectedByStudent: true,
      officialDocument: { $exists: false }
    }).populate({
      path: 'student',
      select: 'name universityId department gpa'
    }).populate({
      path: 'trainingPost',
      select: 'title duration',
      populate: {
        path: 'company',
        select: 'name location'
      }
    });
    
    ApiResponse.success(res, 'Pending applications retrieved successfully', { count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    إنشاء وتقديم وثيقة تدريب رسمية
// @route   POST /api/department-heads/applications/:id/document
// @access  Private/DepartmentHead
exports.submitOfficialDocument = async (req, res, next) => {
  try {
    const { documentContent } = req.body;
    
    if (!documentContent) {
      return next(new ApiError(400, 'Document content is required'));
    }
    
    // التأكد من أن المستخدم المسجل الدخول هو رئيس قسم
    if (req.user.role !== 'department-head') {
      return next(new ApiError(403, 'Not authorized to access department head resources'));
    }
    
    const departmentHead = await DepartmentHead.findOne({ user: req.user.id });
    
    if (!departmentHead) {
      return next(new ApiError(404, 'Department head profile not found'));
    }
    
    // البحث عن الطلب
    const application = await Application.findById(req.params.id)
      .populate('student')
      .populate({
        path: 'trainingPost',
        populate: {
          path: 'company'
        }
      });
    
    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }
    
    // التأكد من أن الطالب في قسم رئيس القسم هذا
    if (application.student.department !== departmentHead.department) {
      return next(new ApiError(403, 'This student is not in your department'));
    }
    
    // التأكد من أن الطالب لديه حالة WAITING_FOR_APPROVAL
    if (application.student.trainingStatus !== 'WAITING_FOR_APPROVAL') {
      return next(new ApiError(400, 'Student is not waiting for approval'));
    }
    
    // حفظ الوثيقة الرسمية (في نظام حقيقي، سيتم تخزين مسار الملف)
    const documentPath = `uploads/official/${application._id}_${Date.now()}.txt`;
    
    application.officialDocument = documentPath;
    application.updatedAt = Date.now();
    await application.save();
    
    // تحديث حالة الطالب إلى IN_TRAINING
    const student = await Student.findById(application.student._id);
    student.trainingStatus = 'IN_TRAINING';
    await student.save();
    
    logger.info(`Department head ${departmentHead.name} submitted official document for student ${student.name} (${student.universityId})`);
    
    ApiResponse.success(res, 'Official document submitted successfully', { application });
  } catch (error) {
    next(error);
  }
};
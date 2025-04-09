const TrainingPost = require('../models/TrainingPost');
const Company = require('../models/Company');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    إنشاء إعلان تدريب جديد
// @route   POST /api/training-posts
// @access  Private/Company
exports.createTrainingPost = async (req, res, next) => {
  try {
    const { title, duration, location, availableUntil, description } = req.body;
    
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to create training posts'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // التحقق من المدة
    if (duration !== 6 && duration !== 8) {
      return next(new ApiError(400, 'Duration must be either 6 or 8 weeks'));
    }
    
    // التحقق من أن تاريخ availableUntil في المستقبل
    const currentDate = new Date();
    const availableUntilDate = new Date(availableUntil);
    
    if (availableUntilDate <= currentDate) {
      return next(new ApiError(400, 'Available until date must be in the future'));
    }
    
    // إنشاء إعلان التدريب
    const post = await TrainingPost.create({
      company: company._id,
      title,
      duration,
      location,
      availableUntil: availableUntilDate,
      description,
      status: 'PENDING'
    });
    
    logger.info(`Company ${company.name} created new training post: ${title}`);
    
    ApiResponse.success(res, 'Training post created successfully and pending approval', { post }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على جميع إعلانات التدريب
// @route   GET /api/training-posts
// @access  Public
exports.getAllPosts = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    // بناء الاستعلام
    const query = {};
    
    if (status) {
      query.status = status.toUpperCase();
    }
    
    // التاريخ الحالي لتصفية الإعلانات المتاحة
    const currentDate = new Date();
    
    // إذا كان الاستعلام عن الإعلانات المعتمدة، يتم عرض المتاحة فقط
    if (query.status === 'APPROVED') {
      query.availableUntil = { $gt: currentDate };
    }
    
    const posts = await TrainingPost.find(query)
      .populate({
        path: 'company',
        select: 'name location fieldOfWork'
      })
      .sort({ createdAt: -1 });
    
    ApiResponse.success(res, 'Training posts retrieved successfully', { count: posts.length, posts });
  } catch (error) {
    next(error);
  }
};

// @desc    الحصول على إعلان تدريب واحد
// @route   GET /api/training-posts/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const post = await TrainingPost.findById(req.params.id)
      .populate({
        path: 'company',
        select: 'name location fieldOfWork phone'
      });
    
    if (!post) {
      return next(new ApiError(404, 'Training post not found'));
    }
    
    ApiResponse.success(res, 'Training post retrieved successfully', { post });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث إعلان تدريب
// @route   PUT /api/training-posts/:id
// @access  Private/Company
exports.updatePost = async (req, res, next) => {
  try {
    const { title, duration, location, availableUntil, description } = req.body;
    
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to update training posts'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // البحث عن الإعلان
    let post = await TrainingPost.findById(req.params.id);
    
    if (!post) {
      return next(new ApiError(404, 'Training post not found'));
    }
    
    // التأكد من أن الإعلان ينتمي لهذه الشركة
    if (post.company.toString() !== company._id.toString()) {
      return next(new ApiError(403, 'Not authorized to update this post'));
    }
    
    // التأكد من أن الإعلان لا يزال معلقًا
    if (post.status !== 'PENDING') {
      return next(new ApiError(400, 'Cannot update a post that has already been approved or rejected'));
    }
    
    // التحقق من المدة إذا تم توفيرها
    if (duration && duration !== 6 && duration !== 8) {
      return next(new ApiError(400, 'Duration must be either 6 or 8 weeks'));
    }
    
    // التحقق من أن تاريخ availableUntil في المستقبل إذا تم توفيره
    if (availableUntil) {
      const currentDate = new Date();
      const availableUntilDate = new Date(availableUntil);
      
      if (availableUntilDate <= currentDate) {
        return next(new ApiError(400, 'Available until date must be in the future'));
      }
    }
    
    // تحديث الإعلان
    post = await TrainingPost.findByIdAndUpdate(
      req.params.id,
      {
        title: title || post.title,
        duration: duration || post.duration,
        location: location || post.location,
        availableUntil: availableUntil ? new Date(availableUntil) : post.availableUntil,
        description: description || post.description,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    logger.info(`Company ${company.name} updated training post: ${post._id}`);
    
    ApiResponse.success(res, 'Training post updated successfully', { post });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف إعلان تدريب
// @route   DELETE /api/training-posts/:id
// @access  Private/Company
exports.deletePost = async (req, res, next) => {
  try {
    // التأكد من أن المستخدم المسجل الدخول هو شركة
    if (req.user.role !== 'company') {
      return next(new ApiError(403, 'Not authorized to delete training posts'));
    }
    
    const company = await Company.findOne({ user: req.user.id });
    
    if (!company) {
      return next(new ApiError(404, 'Company profile not found'));
    }
    
    // البحث عن الإعلان
    const post = await TrainingPost.findById(req.params.id);
    
    if (!post) {
      return next(new ApiError(404, 'Training post not found'));
    }
    
    // التأكد من أن الإعلان ينتمي لهذه الشركة
    if (post.company.toString() !== company._id.toString()) {
      return next(new ApiError(403, 'Not authorized to delete this post'));
    }
    
    // التأكد من أن الإعلان لا يزال معلقًا
    if (post.status !== 'PENDING') {
      return next(new ApiError(400, 'Cannot delete a post that has already been approved or rejected'));
    }
    
    // حذف الإعلان
    await post.remove();
    
    logger.info(`Company ${company.name} deleted training post: ${post._id}`);
    
    ApiResponse.success(res, 'Training post deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

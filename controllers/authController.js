const User = require('../models/User');
const Company = require('../models/Company');
const Student = require('../models/Student');
const DepartmentHead = require('../models/DepartmentHead');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const MinistryService = require('../external/ministryService');
const logger = require('../utils/logger');

// دالة مساعدة لإرسال استجابة رمز JWT
const sendTokenResponse = (user, statusCode, res, message) => {
  // إنشاء الرمز
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  return ApiResponse.success(
    res,
    message,
    { token, user: { id: user._id, email: user.email, role: user.role } },
    statusCode
  );
};

// @desc    تسجيل شركة
// @route   POST /api/auth/register/company
// @access  Public
exports.registerCompany = async (req, res, next) => {
  try {
    const { nationalId, name, phone, location, fieldOfWork, email, password } = req.body;

    // التحقق من تنسيق الرقم الوطني (10 أرقام)
    if (!nationalId.match(/^\d{10}$/)) {
      return next(new ApiError(400, 'National ID must be 10 digits'));
    }

    // التحقق مما إذا كانت الشركة موجودة بالفعل
    const existingCompany = await Company.findOne({ nationalId });
    if (existingCompany) {
      return next(new ApiError(400, 'Company with this National ID already exists'));
    }

    // التحقق من الشركة مع خدمة الوزارة
    const verificationResult = await MinistryService.verifyCompany(nationalId);
    if (!verificationResult.verified) {
      return next(new ApiError(400, 'Company verification failed. Please ensure your National ID is registered with the Ministry of Industry and Trade.'));
    }

    // التحقق مما إذا كان البريد الإلكتروني قيد الاستخدام بالفعل
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, 'Email is already in use'));
    }

    // إنشاء المستخدم
    const user = await User.create({
      email,
      password,
      role: 'company'
    });

    // إنشاء ملف تعريف الشركة
    const company = await Company.create({
      user: user._id,
      nationalId,
      name,
      phone,
      location,
      fieldOfWork,
      verified: true // حيث تم التحقق منها من قبل الوزارة
    });

    logger.info(`New company registered: ${name} (${nationalId})`);

    sendTokenResponse(user, 201, res, 'Company registered successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    تسجيل الدخول للمستخدم
// @route   POST /api/auth/login
// @access  Public

/*
exports.login = async (req, res, next) => {
  try {
    const { email, password, universityId, nationalId } = req.body;
    
    let user;
    
    // التحقق مما إذا كان تسجيل الدخول باستخدام البريد الإلكتروني ( رئيس القسم)
    if (email && password) {
      // البحث عن المستخدم عن طريق البريد الإلكتروني
      user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
      
      // التحقق مما إذا كانت كلمة المرور متطابقة
      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
    } 
    // التحقق مما إذا كان تسجيل الدخول باستخدام رقم الجامعة (للطالب)
    else if (universityId && password) {
      // البحث عن الطالب عن طريق رقم الجامعة
      const student = await Student.findOne({ universityId });
      
      if (!student) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
      
      // الحصول على المستخدم المرتبط بهذا الطالب
      user = await User.findById(student.user).select('+password');
      
      if (!user) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
      
      // التحقق مما إذا كانت كلمة المرور متطابقة
      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
    }
    // التحقق مما إذا كان تسجيل الدخول باستخدام الرقم الوطني (للشركة)
    else if (nationalId && password) {
      // البحث عن الشركة عن طريق الرقم الوطني
      const company = await Company.findOne({ nationalId });
      
      if (!company) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
      
      // الحصول على المستخدم المرتبط بهذه الشركة
      user = await User.findById(company.user).select('+password');
      
      if (!user) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
      
      // التحقق مما إذا كانت كلمة المرور متطابقة
      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        return next(new ApiError(401, 'Invalid credentials'));
      }
    } else {
      return next(new ApiError(400, 'Please provide valid credentials'));
    }
    
    // تسجيل الدخول الناجح
    logger.info(`User logged in: ${user.email} (${user.role})`);
    
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};
*/



















//تسجيل دخول حسب شات جي بي تي 
// @desc    تسجيل الدخول للمستخدم
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, studentId, nationalId } = req.body;

    let user;

    // ✅ تسجيل الدخول كرئيس قسم (باستخدام البريد الإلكتروني)
    if (email && password) {
      user = await User.findOne({ email }).select('+password');

      if (!user) {
        return next(new ApiError(401, 'بيانات تسجيل الدخول غير صحيحة'));
      }

      // التحقق من كلمة المرور
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return next(new ApiError(401, 'بيانات تسجيل الدخول غير صحيحة'));
      }
    } 
    // ✅ تسجيل الدخول كطالب (باستخدام الرقم الجامعي)
    else if (studentId && password) {
      user = await User.findOne({ studentId }).select('+password');

      if (!user) {
        return next(new ApiError(401, 'بيانات تسجيل الدخول غير صحيحة'));
      }

      // التحقق من كلمة المرور
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return next(new ApiError(401, 'بيانات تسجيل الدخول غير صحيحة'));
      }
    } 
    // ✅ تسجيل الدخول كشركة (باستخدام الرقم الوطني)
    else if (nationalId && password) {
      user = await User.findOne({ nationalId }).select('+password');

      if (!user) {
        return next(new ApiError(401, 'بيانات تسجيل الدخول غير صحيحة'));
      }

      // التحقق من كلمة المرور
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return next(new ApiError(401, 'بيانات تسجيل الدخول غير صحيحة'));
      }
    } 
    // ❌ في حال لم يتم تقديم بيانات تسجيل صحيحة
    else {
      return next(new ApiError(400, 'يرجى إدخال بيانات تسجيل صحيحة'));
    }

    // ✅ تسجيل الدخول الناجح
    logger.info(`تم تسجيل الدخول: ${user.role} (${user._id})`);
    sendTokenResponse(user, 200, res, 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
};


















// @desc    الحصول على المستخدم الحالي المسجل الدخول
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    let profile;
    
    // الحصول على الملف الشخصي المناسب بناءً على دور المستخدم
    switch (user.role) {
      case 'company':
        profile = await Company.findOne({ user: user._id });
        break;
      case 'student':
        profile = await Student.findOne({ user: user._id });
        break;
      case 'department-head':
        profile = await DepartmentHead.findOne({ user: user._id });
        break;
    }
    
    ApiResponse.success(res, 'User retrieved successfully', { user, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    تحديث كلمة المرور
// @route   PUT /api/auth/updatepassword
// @access  Private/Company
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // الحصول على المستخدم حسب المعرف مع كلمة المرور
    const user = await User.findById(req.user.id).select('+password');
    
    // التحقق من كلمة المرور الحالية
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return next(new ApiError(401, 'Current password is incorrect'));
    }
    
    // تحديث كلمة المرور
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();
    
    logger.info(`Password updated for user: ${user.email}`);
    
    sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};
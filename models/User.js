const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { number } = require('joi');

const userSchema = new mongoose.Schema({
  
  role: {
    type: String,
    enum: ['student', 'company', 'department-head']
    
  },
   studentId: {
    type: Number,
    unique: true,
    sparse: true, // يسمح بأن يكون الحقل غير موجود لبعض المستخدمين
    validate: {
      validator: function(v) {
        return /^\d{7}$/.test(v); // التحقق من أنه 7 أرقام
      },
      message: 'Student ID must be 7 digits'
    },
    required: function () {
      return this.role === 'student'; // مطلوب فقط إذا كان الدور "company"
    }
  },
  nationalId: {
    type: Number,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v); // التحقق من أنه 10 أرقام
      },
      message: 'National ID must be 10 digits'
    },
    required: function () {
      return this.role === 'company'; // مطلوب فقط إذا كان الدور "company"
    }
  },

  email: {
    type: String,
    sparse: true,
    required: function () {
      return this.role === 'department-head'; // مطلوب فقط إذا كان الدور "company"
    },
    
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user changed password after the token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;








///كود غير من شات جي بي تي 
/*
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    sparse: true, // يسمح بأن يكون الحقل غير موجود لبعض المستخدمين
    validate: {
      validator: function(v) {
        return /^\d{7}$/.test(v); // التحقق من أنه 7 أرقام
      },
      message: 'Student ID must be 7 digits'
    }
  },
  nationalId: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v); // التحقق من أنه 10 أرقام
      },
      message: 'National ID must be 10 digits'
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@department\.edu\.jo$/.test(v); // بريد رئيس القسم
      },
      message: 'Invalid department head email format'
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'company', 'department-head'],
    required: true
  },
  verifiedCompany: {
    type: Boolean,
    default: false // الشركات تحتاج تحقق قبل السماح بإنشاء الحساب
  },
  trainingHours: {
    type: Number,
    default: 0 // عدد ساعات التدريب للطالب
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// إنشاء توكن JWT
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
*/
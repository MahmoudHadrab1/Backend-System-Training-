/*const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const config = require('../config/config'); // تأكدي أن لديك ملف `config.js` يحتوي على إعدادات `jwt`
const User = require('../models/User'); // استيراد موديل المستخدم
const Student = require('../models/Student'); // استيراد موديل الطالب

dotenv.config();



async function testStudentModel() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

   
    
    // 1️⃣ إنشاء مستخدم جديد
    const user = new User({
        studentId: 2137583,
      password: 'A12121212$',
      role: 'student'
    });

    await user.save();
    console.log('✅ User created:', user);

    // 2️⃣ إنشاء طالب وربطه بالمستخدم
    const testStudent = new Student({
      user: user._id, // يجب ربط الطالب بالمستخدم الذي أنشأناه
     universityId: 2137583,
      name: 'Dema Rabee',
      department: 'SW',
      completedHours: 80
    });

    await testStudent.save();
    console.log('✅ Student created:', testStudent);

    // 3️⃣ اختبار جلب الطالب مع بيانات المستخدم
    const fetchedStudent = await Student.findOne({ universityId: '2137583' }).populate('user');
    console.log('✅ Fetched Student:', fetchedStudent);

    // 4️⃣ إغلاق الاتصال بقاعدة البيانات بعد انتهاء الاختبار
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

// تشغيل الاختبار
testStudentModel();*/

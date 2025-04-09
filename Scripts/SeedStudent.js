require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // تأكد من المسار الصحيح
const Student = require('../models/Student'); // تأكد من المسار الصحيح

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// بيانات وهمية للطلاب
const studentsData = [
  {
    universityId: 2134567,
    name: 'Deema Rabee Tawfiq Abu Hassouneh',
    department: 'SW',
    completedHours: 95,
    password: 'X123456*'
  },
  {
    universityId: 2345678,
    name: 'Ahmad Ased Rashieed Assad',
    department: 'CIS',
    completedHours: 87,
    password: 'D123456*'
  },
  {
    universityId: 3456789,
    name:'Mahmoud Jehad Hamdan Hadrab',
    department: 'BIT',
    completedHours: 92,
    password: 'F123456*'
  },
  {
    universityId: 2267890,
    name: 'Mohammad Omar Mohd Almashagbeh',
    department: 'AI',
    completedHours: 84,
    password: 'O123456*'
  }
];

// وظيفة لإضافة البيانات
const seedStudents = async () => {
  try {
    // حذف البيانات السابقة
    await Student.deleteMany({});
    await User.deleteMany({});

    console.log('Previous student data cleared');
    
    // إنشاء مستخدمين وطلاب جدد
    for (const studentData of studentsData) {
      // إنشاء مستخدم أولاً
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(studentData.password, salt);
      
      const user = await User.create({
        // استخدام universityId كـ studentId
        studentId: studentData.universityId, // استخدام الرقم الجامعي كرقم الطالب
        password: hashedPassword,
        role: 'student'
      });
      
      // إنشاء ملف الطالب وربطه بالمستخدم
      await Student.create({
        user: user._id, // ربط الطالب بالمستخدم
        universityId: studentData.universityId,
        name: studentData.name,
        department: studentData.department,
        completedHours: studentData.completedHours,
        trainingStatus: 'NOT_STARTED'
      });
    }
    
    console.log('Student data seeded successfully!');
    console.log(`Added ${studentsData.length} students to the database`);
    console.log('Students can login with their universityId and password "student123"');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// تنفيذ العملية
connectDB().then(() => {
  seedStudents();
});

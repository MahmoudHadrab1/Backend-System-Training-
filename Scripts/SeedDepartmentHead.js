const mongoose = require('mongoose');
const User = require('../models/User');
const DepartmentHead = require('../models/DepartmentHead');
const dotenv = require('dotenv');

dotenv.config();

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const seedDepartmentHeads = async () => {
  try {
    // حذف البيانات السابقة
    await DepartmentHead.deleteMany({});
    await User.deleteMany({ role: 'department-head' });

    console.log('Previous department heads cleared');

    // بيانات رؤساء الأقسام
    const departmentHeadsData = [
      { name: 'Aladdin Hussein Abdel Lateef Baarah',
         email: 'aladdin.baarah@staff.hu.edu.jo', 
         department: 'CIS' },

      { name: 'Bashar Abdul Kareem Mahmoud Al shboul', 
        email: 'bashar.alshboul@staff.hu.edu.jo', 
        department: 'SW' },

      { name: 'Mohammad Zarour',
         email: 'mzarour@staff.hu.edu.jo', 
         department: 'BIT' },

      { name: 'Hani Ahmad Khalf Bani-Salameh',
         email: 'hani@staff.hu.edu.jo',
          department: 'AI' }
    ];

    for (const head of departmentHeadsData) {
      // إنشاء مستخدم جديد لكل رئيس قسم
      const user = new User({
        role: 'department-head',
        email: head.email,
        password: 'head1234' // كلمة مرور افتراضية
      });
      await user.save();

      // إنشاء رئيس قسم مرتبط بالمستخدم
      await new DepartmentHead({
        user: user._id,
        name: head.name,
        department: head.department
      }).save();
    }

    console.log('Department heads added successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error while adding department heads:', error);
    mongoose.connection.close();
  }
};

seedDepartmentHeads();

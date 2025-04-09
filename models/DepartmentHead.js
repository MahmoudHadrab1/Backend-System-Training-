const mongoose = require('mongoose');

const departmentHeadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Department head name is required']
  },
  department: {
    type: String,
    enum: ['SW', 'CIS', 'BIT', 'AI', 'CS', 'CYBER'],
    required: [true, 'Department is required'],
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DepartmentHead = mongoose.model('DepartmentHead', departmentHeadSchema);

module.exports = DepartmentHead;
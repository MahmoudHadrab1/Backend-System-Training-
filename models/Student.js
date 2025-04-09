const { number } = require('joi');
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  universityId: {
    type: Number,
    required: [true, 'University ID is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{7}$/.test(v);
      },
      message: props => `${props.value} is not a valid University ID. It must be 7 digits.`
    }
  },
  name: {
    type: String,
    required: [true, 'Student name is required']
  },
  department: {
    type: String,
    enum: ['SW', 'CIS', 'BIT', 'AI', 'CS', 'CYBER'],
    required: [true, 'Department is required']
  },
  completedHours: {
    type: Number,
    required: [true, 'Completed hours are required'],
    min: 0
  },
  trainingStatus: {
    type: String,
    enum: ['NOT_STARTED', 'WAITING_FOR_APPROVAL', 'IN_TRAINING', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for applications
studentSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'student',
  justOne: false
});

const Student = mongoose.model('Student', studentSchema);

//انشاء نموذج للتحقق
/*
const teststudent =new Student({
  universityId:2137583
 ,  
 name: 'dema rabee' 
 , 
 department: 'SW'
 ,
 completedHours: 80 
 , 
 
})*/
module.exports = Student;
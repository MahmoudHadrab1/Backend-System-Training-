const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  trainingPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingPost',
    required: true
  },
  cv: {
    type: String,
    required: [true, 'CV is required']
  },
  status: {
    type: String,
    enum: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'UNDER_REVIEW'
  },
  selectedByStudent: {
    type: Boolean,
    default: false
  },
  officialDocument: {
    type: String
  },
  approvalFiles: [String],
  activityReports: [String],
  finalReport: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Prevent duplicate applications
applicationSchema.index({ student: 1, trainingPost: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
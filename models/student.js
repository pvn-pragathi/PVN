const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  Telugu: Number,
  Hindi: Number,
  English: Number,
  Maths: Number,
  Science: Number,
  Social: Number,
});

const examSchema = new mongoose.Schema({
  name: String,
  marks: subjectSchema,
});

const studentSchema = new mongoose.Schema({
  SNO: Number,
  "S NAME": String,
  "ADMN": Number,
  DOB: String,
  "F NAME": String,
  "M NAME": String,
  CLASS: String,
  Section: String,
  "PH-1": String,
  "PH-2": String,
  "AADHAR NO": Number,
  "Exam Result": [examSchema],
});

const Student = mongoose.model("Student", studentSchema);

const dayStudentSchema = new mongoose.Schema({
  "NAME OF THE STUDENT": String,
  "SECTION": String,
  "FATHER NAME": String,
  "MOTHER NAME": String,
  "CONTACT NO-I": String,
  "CONTACT NO-II": String,
  "ADMN": Number,
  "AADHAR": Number,
  "Exam Result": [examSchema],
});

const DayStudent = mongoose.model("DayStudent", dayStudentSchema);

module.exports = { Student, DayStudent };

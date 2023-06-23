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
  "Student Name": String,
  "Admission Number": Number,
  DOB: String,
  "Father Name": String,
  "Mother Name": String,
  Class: Number,
  Section: String,
  "Phone no - 1": Number,
  "Phone no - 2": Number,
  "Aadhar Number": Number,
  exams: [examSchema],
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;

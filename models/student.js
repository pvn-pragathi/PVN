// student.js
const mongoose = require("mongoose");

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
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;

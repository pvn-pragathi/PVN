const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("./models/student");
const nodemailer = require("nodemailer");
const https = require("https");

var accessToken =
  "EAAXtoFVnzq8BAOZB8TEL5DB02ZB3zhjdf2cdcgIBGhdDobJA9SH1GmB4UDxncaLEtxAQoeP77WkWwmeFUOMZCgLaKjaAhrqfZAbYwTJgenAQYppFSCI8ZAVeW4nJfulKxmwu9LtHW8NfZCGw3PFWS7jwRDnvCDoQxH8umsxcN7SVdO3sUGegpTCy2sq1v8ssZC1ZCelkHVxJE0HfhV43nU4yzCt7OalXf5IZD";

async function populateDatabaseFromExcel(filePath) {
  try {

    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    const students = jsonData.map((data) => new Student(data));

    await Student.insertMany(students);
    console.log("Database populated successfully.");
  } catch (error) {
    throw error;
  }
}

async function populateMarksFromExcel(filePath, examName) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = jsonData[1].map((header) => header.trim());
      const marksData = jsonData.slice(2);

      for (const row of marksData) {
        const admissionNumber = row[0];

        if (!admissionNumber) {
          console.log('Invalid admission number in row:', marksData.indexOf(row) + 2);
          continue;
        }

        const student = await Student.findOne({ 'Admission Number': admissionNumber });

        if (!student) {
          console.log('No student found with admission number:', admissionNumber);
          continue;
        }

        const examMarks = {};
        for (let i = 2; i < row.length; i++) {
          const subject = headers[i];
          const marks = row[i];

          if (subject !== 'Roll Number' && subject !== 'NAME OF THE STUDENT') {
            examMarks[subject] = marks;
          }
        }

        const examIndex = student['Exam Result'].findIndex((exam) => exam.name === examName);

        if (examIndex === -1) {
          student['Exam Result'].push({ name: examName, marks: examMarks });
        } else {
          student['Exam Result'][examIndex].marks = examMarks;
        }

        await student.save();
        console.log('Marks updated for student with admission number:', admissionNumber);
      }

      console.log(`Marks population from Sheet "${sheetName}" completed successfully.`);
    }

    console.log('Marks population from all sheets completed successfully.');
  } catch (error) {
    throw error;
  }
}


function getLatestFilePath(directoryPath) {
  const files = fs.readdirSync(directoryPath);

  if (files.length === 0) {
    return null;
  }

  files.sort(function (a, b) {
    return (
      fs.statSync(directoryPath + b).mtime.getTime() -
      fs.statSync(directoryPath + a).mtime.getTime()
    );
  });

  return directoryPath + files[0];
}

function sendEmail(content) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "pragathiutility@gmail.com",
      pass: "tqbntkujmegkesmu",
    },
  });

  const mailOptions = {
    from: "pragathiutility@gmail.com",
    to: "pragathiutility@gmail.com",
    subject: "New Admission",
    text: content,
  };

  return transporter.sendMail(mailOptions);
}


module.exports = {
  populateDatabaseFromExcel,
  populateMarksFromExcel,
  getLatestFilePath,
  sendEmail,
};

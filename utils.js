// utils.js

const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("./models/student");
const nodemailer = require("nodemailer");

async function populateDatabaseFromExcel(filePath) {
  try {
    await Student.deleteMany({});

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
  getLatestFilePath,
  sendEmail,
};

const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("./models/student");
const nodemailer = require("nodemailer");
const https = require("https");

var accessToken =
  "EAAXtoFVnzq8BAKyrB6J1Uela7YbcHUQR9VtHi8o7simxJS4QYApEZAsd6PgmmJCHMQAweysIYqttm5B3QChKWdBoZBb1J06Bq3qT52Y1B0TDSVu1YE2lnrOCVtqlZBN5q5wwZCXh2mqpTCWjU3iS8mU1ukfM6JSd8vTKHeHZCbXGSQRPDfNqSDGvhjEy9uCM6MUeKXJIk4QCKl1UTbhs2";

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
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
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

      const examIndex = student.exams.findIndex((exam) => exam.name === examName);

      if (examIndex === -1) {
        student.exams.push({ name: examName, marks: examMarks });
      } else {
        student.exams[examIndex].marks = examMarks;
      }

      await student.save();
      console.log('Marks updated for student with admission number:', admissionNumber);
    }

    console.log('Marks population from Excel completed successfully.');
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

// function fetchNewAccessToken(callback) {
//   const endpoint =

//   https.get(endpoint, function (response) {
//     let chunks = "";

//     response.on("data", function (chunk) {
//       chunks += chunk;
//     });

//     response.on("end", function () {
//       const responseData = JSON.parse(chunks);
//       const newAccessToken = responseData.access_token;

//       callback(newAccessToken);
//     });
//   });
// }

// function renewAccessToken(callback) {
//   fetchNewAccessToken(function (newAccessToken) {
//     accessToken = newAccessToken;
//     console.log("Access token renewed successfully!");
//     if (callback) {
//       callback();
//     }
//   });
// }

module.exports = {
  populateDatabaseFromExcel,
  populateMarksFromExcel,
  getLatestFilePath,
  sendEmail,
};

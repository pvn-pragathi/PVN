const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("./models/student");
const nodemailer = require("nodemailer");
const https = require("https");


var accessToken =
  "EAAXtoFVnzq8BAKyrB6J1Uela7YbcHUQR9VtHi8o7simxJS4QYApEZAsd6PgmmJCHMQAweysIYqttm5B3QChKWdBoZBb1J06Bq3qT52Y1B0TDSVu1YE2lnrOCVtqlZBN5q5wwZCXh2mqpTCWjU3iS8mU1ukfM6JSd8vTKHeHZCbXGSQRPDfNqSDGvhjEy9uCM6MUeKXJIk4QCKl1UTbhs2";

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
  getLatestFilePath,
  sendEmail,
}
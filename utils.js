// utils.js

const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("./models/student");
const nodemailer = require("nodemailer");
const https = require("https");

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


function fetchNewAccessToken(appId, appSecret, oldAccessToken, callback) {
  const endpoint = `https://graph.facebook.com/v13.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${oldAccessToken}`;

  https.get(endpoint, function (response) {
    let chunks = "";

    response.on("data", function (chunk) {
      chunks += chunk;
    });

    response.on("end", function () {
      const responseData = JSON.parse(chunks);
      const newAccessToken = responseData.access_token;

      callback(newAccessToken);
    });
  });
}



module.exports = {
  populateDatabaseFromExcel,
  getLatestFilePath,
  sendEmail,
  fetchNewAccessToken,
};

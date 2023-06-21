const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("./models/student");
const nodemailer = require("nodemailer");
const https = require("https");

const appId = "1668647766970031";
const appSecret = "1feef404e27715163eb2da055d931b88";
let accessToken =
  "EAAXtoFVnzq8BAFVkNqHdTVN3bphjQwZCuuLbFPfVSIVZAIZCrOrW2ptMXBqzBDV5JCL0HggH50eg1lZBpKRwJf5wdGqXbyi3D9N913asvZBOvhzeU1oUAQeRob9g7gHiEt4E5kZBSFAHOiJpCdLv8thSgj6riUW9gEy6lkHIrqdSQZA4fQ3BwftLlABZAGR8KpfVO2063kTE7ZC8s4s3MisfE";

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

function fetchNewAccessToken(callback) {
  const endpoint = `https://graph.facebook.com/v13.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`;

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

function renewAccessToken(callback) {
  fetchNewAccessToken(function (newAccessToken) {
    accessToken = newAccessToken;
    console.log("Access token renewed successfully!");
    if (callback) {
      callback();
    }
  });
}

module.exports = {
  populateDatabaseFromExcel,
  getLatestFilePath,
  sendEmail,
  fetchNewAccessToken,
  renewAccessToken,
  accessToken,
};

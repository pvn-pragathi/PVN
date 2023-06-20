// utils.js

const xlsx = require("xlsx");
const fs = require("fs");
const Student = require("./models/student");

function populateDatabaseFromExcel(filePath) {
  return new Promise((resolve, reject) => {
    Student.deleteMany({}, (error) => {
      if (error) {
        reject(error);
      } else {
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        const students = jsonData.map((data) => new Student(data));

        Student.insertMany(students)
          .then(() => {
            console.log("Database populated successfully.");
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      }
    });
  });
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

module.exports = {
  populateDatabaseFromExcel,
  getLatestFilePath,
};

const xlsx = require("xlsx");
const fs = require("fs");
const nodemailer = require("nodemailer");
require('dotenv').config();
const excel = require("exceljs");

async function populateDatabaseFromExcel(
  filePath,
  isDaySchool,
  regularModel,
  dayModel
) {
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    const headers = jsonData[1];

    // Remove the first two rows (heading and headers)
    jsonData.splice(0, 2);

    const students = [];

    jsonData.forEach((row) => {
      const studentData = {};

      // Map the values in each row to their respective headers
      for (let i = 0; i < headers.length; i++) {
        studentData[headers[i]] = row[i];
      }

      const model = isDaySchool ? dayModel : regularModel;
      const student = new model(studentData);
      students.push(student);
    });

    // Delete existing collection
    const model = isDaySchool ? dayModel : regularModel;

    console.log(students);
    await model.insertMany(students);

    console.log(`Database populated from ${filePath}.`);
  } catch (error) {
    console.error(`Error populating database from ${filePath}:`, error);
    throw error;
  }
}

async function populateMarksFromExcel(filePath, examName, regularModel, dayModel) {
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
          console.log("Invalid admission number in row:", marksData.indexOf(row) + 2);
          continue;
        }

        const model = isDaySchool ? dayModel : regularModel;
        const student = await model.findOne({ ADMN: admissionNumber });

        if (!student) {
          console.log("No student found with admission number:", admissionNumber);
          continue;
        }

        const examMarks = {};
        for (let i = 2; i < row.length; i++) {
          const subject = headers[i];
          const marks = row[i];

          if (subject !== "Roll Number" && subject !== "NAME OF THE STUDENT") {
            examMarks[subject] = marks;
          }
        }

        const examIndex = student["Exam Result"].findIndex((exam) => exam.name === examName);

        if (examIndex === -1) {
          student["Exam Result"].push({ name: examName, marks: examMarks });
        } else {
          student["Exam Result"][examIndex].marks = examMarks;
        }

        await student.save();
        console.log("Marks updated for student with admission number:", admissionNumber);
      }

      console.log(`Marks population from Sheet "${sheetName}" completed successfully.`);
    }

    console.log("Marks population from all sheets completed successfully.");
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
      user: "pragathi.admission@gmail.com",
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "pragathi.admission@gmail.com",
    to: "pragathi.admission@gmail.com",
    subject: "New Admission",
    text: content,
  };

  return transporter.sendMail(mailOptions);
}

async function updateExcelFile(excelFilePath, formData) {
  const workbook = new excel.Workbook();

  try {
    // Attempt to read the existing file
    await workbook.xlsx.readFile(excelFilePath);
  } catch (error) {
    // If the file doesn't exist, create a new workbook
    console.error("Error reading existing file:", error);
  }

  const worksheet = workbook.getWorksheet(1);

  // If the worksheet is empty, add headers
  if (worksheet.rowCount === 0) {
    worksheet.addRow(Object.keys(formData));
  }

  // Add a new row with form data
  const newRow = worksheet.addRow(Object.values(formData));

  // Optionally, you can customize formatting or perform additional operations on the new row

  try {
    // Save the updated workbook
    await workbook.xlsx.writeFile(excelFilePath);
  } catch (error) {
    console.error("Error saving updated workbook:", error);
  }
}


function calculateGrade(marks) {
  if (marks >= 91 / 5) {
    return "A1";
  } else if (marks >= 81 / 5) {
    return "A2";
  } else if (marks >= 71 / 5) {
    return "B1";
  } else if (marks >= 61 / 5) {
    return "B2";
  } else if (marks >= 51 / 5) {
    return "C1";
  } else if (marks >= 41 / 5) {
    return "C2";
  } else if (marks >= 35 / 5) {
    return "D";
  } else if (marks >= 2) {
    return "E";
  } else if (marks >= 0) {
    return "AB";
  }
}

function calculatePoints(grade) {
  if (grade === "A1") {
    return 10;
  } else if (grade === "A2") {
    return 9;
  } else if (grade === "B1") {
    return 8;
  } else if (grade === "B2") {
    return 7;
  } else if (grade === "C1") {
    return 6;
  } else if (grade === "C2") {
    return 5;
  } else if (grade === "D") {
    return 4;
  } else if (grade === "E") {
    return 3;
  } else if (grade === "AB") {
    return 0;
  }
}

function calculateOverallGrade(percentage) {
  if (percentage >= 91) {
    return "A1";
  } else if (percentage >= 81) {
    return "A2";
  } else if (percentage >= 71) {
    return "B1";
  } else if (percentage >= 61) {
    return "B2";
  } else if (percentage >= 51) {
    return "C1";
  } else if (percentage >= 41) {
    return "C2";
  } else if (percentage >= 35) {
    return "D";
  } else if (percentage >= 2) {
    return "E";
  } else if (percentage >= 0) {
    return "AB";
  }
}

function calculateGPA(pointsArray) {
  if (pointsArray.length === 0) {
    return 0;
  }

  const sumPoints = pointsArray.reduce((total, points) => total + points, 0);
  const averagePoints = sumPoints / pointsArray.length;
  const gpa = Math.round(averagePoints * 10) / 10; // Round to 1 decimal place

  return gpa;
}

module.exports = {
  populateDatabaseFromExcel,
  populateMarksFromExcel,
  getLatestFilePath,
  sendEmail,
  calculateGrade,
  calculatePoints,
  calculateOverallGrade,
  calculateGPA,
  updateExcelFile
};

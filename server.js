const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const https = require("https");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const http = require('http');
const socketIO = require('socket.io');
const Student = require("./models/student");
const Circular = require("./models/circular");
const { populateDatabaseFromExcel, getLatestFilePath , sendEmail, populateMarksFromExcel, calculateGrade, calculatePoints, calculateOverallGrade, calculateGPA} = require("./utils");
const PORT = process.env.PORT || 3030;
const cron = require("node-cron");
const path = require("path");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "PRAGATHI12345",
    resave: false,
    saveUninitialized: true,
  })
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the destination folder where uploaded files will be stored
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Specify a custom filename for the uploaded file
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });



app.use(methodOverride("_method"));

const uri = 'mongodb+srv://swaroop-chikkam:630swaroop@pvn.vdv88pa.mongodb.net/studentDataDB?retryWrites=true&w=majority'

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const excelFilePath = `${__dirname}/student-details/school-data.xlsx`;

app.get("/admin", function (req, res) {
  res.render("admin", { message: "" });
});

app.post("/admin", upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'fileFA1', maxCount: 1 },
  { name: 'fileFA2', maxCount: 1 },
  { name: 'fileFA3', maxCount: 1 },
  { name: 'fileFA4', maxCount: 1 },
  { name: 'fileSA1', maxCount: 1 },
  { name: 'fileSA2', maxCount: 1 }
]), async function (req, res) {
  const username = req.body.username.trim();
  const password = req.body.password.trim();

  if (username === "PVN@admin" && password === "PVN@website") {
    req.session.adminAuthenticated = true;

    if (req.files) {
      const examFiles = [
        { fieldName: 'fileFA1', examName: 'FA-1' },
        { fieldName: 'fileFA2', examName: 'FA-2' },
        { fieldName: 'fileFA3', examName: 'FA-3' },
        { fieldName: 'fileFA4', examName: 'FA-4' },
        { fieldName: 'fileSA1', examName: 'SA-1' },
        { fieldName: 'fileSA2', examName: 'SA-2' }
      ];

      for (const examFile of examFiles) {
        const fieldName = examFile.fieldName;
        const examName = examFile.examName;
        const files = req.files[fieldName];

        if (files && files.length > 0) {
          const file = files[0];
          const newFilePath = path.join(__dirname, "student-marks-sheet", `${examName}.xlsx`);
          const previousFilePath = getLatestFilePath("student-marks-sheet/");

          if (previousFilePath) {
            fs.unlinkSync(previousFilePath);
          }

          fs.renameSync(file.path, newFilePath);

          try {
            await populateMarksFromExcel(newFilePath, examName);
            console.log(`Marks population for ${examName} completed successfully.`);
          } catch (error) {
            console.error(`Error updating marks for ${examName}:`, error);
          }
        } else {
          console.log(`No file uploaded for ${examName}`);
        }
      }

      const schoolDataFiles = req.files['file'];
      if (schoolDataFiles && schoolDataFiles.length > 0) {
        const schoolDataFile = schoolDataFiles[0];
        const newFilePath = path.join(__dirname, "student-details", schoolDataFile.originalname);
        const previousFilePath = getLatestFilePath("student-details/");

        if (previousFilePath) {
          fs.unlinkSync(previousFilePath);
        }

        fs.renameSync(schoolDataFile.path, newFilePath);

        try {
          await populateDatabaseFromExcel(newFilePath);
          console.log("Database updated successfully.");
        } catch (error) {
          console.error("Error updating database:", error);
        }
      } else {
        console.log("No school data file uploaded");
      }

      res.render("admin", { message: "Files uploaded successfully" });
    } else {
      res.render("admin", { message: "No file uploaded" });
    }
  } else {
    res.render("admin", { message: "Invalid username or password" });
  }
});



app.use((error, req, res, next) => {
  console.log('This is the rejected field ->', error.field);
});

app.post("/student-login", async (req, res) => {
  const aadharNumber = req.body.aadhar.replace(/\s/g, "");
  const password = req.body.password;

  try {
    const student = await Student.findOne({ "Aadhar Number": aadharNumber });

    if (!student) {
      console.log(
        "Aadhar number not found in the database. Please update your Aadhar number in the database."
      );
      return res.render("student-login", {
        message:
          "Aadhar number not found in the database. Please update your Aadhar number in the database.",
      });
    }

    const admissionNumber = student["Admission Number"].toString();
    const expectedPassword = `PVN@${admissionNumber}`;

    if (password !== expectedPassword) {
      console.log("Invalid password");
      return res.render("student-login", { message: "Invalid password" });
    }

    const studentDetails = student.toObject();
    delete studentDetails._id;
    delete studentDetails.__v;
    delete studentDetails.SNO;

    req.session.student = {
      class: studentDetails.Class,
    };
    req.session.studentId = student._id; // Store the student ID in the session
    res.set("Cache-Control", "no-store");
    return res.render("student-details", { studentDetails, marks: true , calculateGrade, calculatePoints, calculateOverallGrade, calculateGPA});

    // Rest of the code...
  } catch (error) {
    console.error("Error retrieving student details from the database:", error);
    return res.render("student-login", {
      message: "An error occurred. Please try again later.",
    });
  }
});

app.get("/", function (req, res) {
  res.render("index"); 
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/admission", function (req, res) {
  const submitted = req.session.submitted;
  const error = req.session.error;
  delete req.session.submitted;
  delete req.session.error;
  res.render("admission", { submitted, error });
});

app.post("/admission", function(req, res){
  const formData = req.body;
  const formattedData = `Name: ${formData.studentname}\nMother Name: ${formData.mothername}\nFather Name: ${formData.fathername}\nStudent age: ${formData.age}\nDOB: ${formData.dob}\nAdmission Class: ${formData.admissioninto}\nAddress: ${formData.address}\nAadhar No: ${formData.aadhar}\nContact-1: ${formData.contact1}\nContact-2: ${formData.contact2}`;

  sendEmail(formattedData)
      .then(() => {
          // Set a flag to indicate successful form submission
          req.session.submitted = true;
          res.redirect('/admission');
      })
      .catch((error) => {
          console.error('Error sending email:', error);
          // Set an error flag to indicate form submission error
          req.session.error = true;
          res.redirect('/admission');
      });
});


const appId = "1668647766970031";
const appSecret = "1feef404e27715163eb2da055d931b88";
let oldAccessToken = "EAAXtoFVnzq8BAI20Hi6TSrhVC2QDGQQup045N4UxQgq7b1qAJErIfftCTRbcNWTZCSC6Ltr8wU1ZAnRHV83mKwJFfcNMyk7ZCtRFl6VpYkboO4xkRNQBghB0xIexpaNk4ETx88aq4Mqa0ZAZCpQxAQtQZCm5oQrrZCCeQ70GgXo41yif8xM6gxL8oUAqNaqdGOBkiClZBxW5EKsxSLNhCql8";

app.get("/fb-token", function (req, res) {
  fetchNewAccessToken(appId, appSecret, oldAccessToken, function (newAccessToken) {
    oldAccessToken = newAccessToken;
    res.send("Access token renewed successfully!");
  });
  renewAccessToken();
  res.send("Access token renewed successfully!");
});

app.get('/gallery', (req, res) => {
  const galleryPath = path.join(__dirname, 'public', 'images', 'gallery');

  fs.readdir(galleryPath, (err, folders) => {
    if (err) {
      console.error('Error reading gallery folders:', err);
      res.render('gallery', { folders: [], photos: {} });
      return;
    }

    const photos = {};

    folders.forEach((folder) => {
      const folderPath = path.join(galleryPath, folder);

      fs.readdir(folderPath, (err, files) => {
        if (err) {
          console.error(`Error reading files in folder ${folder}:`, err);
          photos[folder] = [];
        } else {
          photos[folder] = files;
        }

        if (Object.keys(photos).length === folders.length) {
          // All folders have been processed, render the template
          res.render('gallery', { folders, photos });
        }
      });
    });
  });
});




app.get("/fee", function (req, res) {
  res.render("fee");
});

app.get("/ssc-results", function (req, res) {
  res.render("ssc-results");
});

app.get("/rules", function (req, res) {
  res.render("rules");
});
 
app.get("/student-login", (req, res) => {
  res.render("student-login", { message: "" });
});

app.get("/circulars", async (req, res) => {
  try {
    const circulars = await Circular.find().sort({ date: -1 });
    res.render("circulars", { circulars, message: "", teacherLoggedIn: req.session.teacher });
  } catch (error) {
    console.error("Error retrieving circulars:", error);
    res.render("circulars", { circulars: [], message: "Error retrieving circulars", teacherLoggedIn: req.session.teacher });
  }
});



app.get("/teacher-login", (req, res) => {
  res.render("teacher-login", { message: "" });
});

app.post("/teacher-login", (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password.trim();

  if (username === "PVN@teacher" && password === "PVN@circular") {
    req.session.teacher = true;
    res.redirect("/post-circular");
  } else {
    res.render("teacher-login", { message: "Invalid username or password" });
  }
});

app.get("/post-circular", (req, res) => {
  res.render("post-circular", { message: "" });
});

app.post("/post-circular", async (req, res) => {
  if (!req.session.teacher) {
    return res.redirect("/teacher-login");
  }

  const { title, classes, date, day, content } = req.body;
  const circular = new Circular({
    title,
    classes,
    date,
    day,
    content,
  });

  try {
    await circular.save();
    io.emit('newCircular', circular);
    return res.redirect("/post-circular");
  } catch (error) {
    console.error("Error posting circular:", error);
    return res.redirect("/post-circular");
  }
});


app.delete("/circulars/:id", async (req, res) => {
  if (req.session.teacher) {
    const circularId = req.params.id;

    try {
      await Circular.findByIdAndDelete(circularId);
      console.log("Circular deleted:", circularId);
      res.redirect("/circulars");
    } catch (error) {
      console.error("Error deleting circular:", error);
      res.redirect("/circulars");
    }
  } else {
    res.redirect("/teacher-login");
  }
});


app.listen(PORT, function () {
  console.log(`Server started at port ${PORT}.`);
});



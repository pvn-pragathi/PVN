const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const session = require("express-session");
const xlsx = require("xlsx");
const https = require("https");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");

const app = express();
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

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1/studentDataDB", {
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

// Define Mongoose schema and models for circulars
const circularSchema = new mongoose.Schema({
  title: String,
  classes: [String],
  date: String,
  day: String,
  content: String,
});

const Circular = mongoose.model("Circular", circularSchema);

// Populate database from Excel on server startup
async function populateDatabaseFromExcel(filePath) {
  try {
    await Student.deleteMany();

    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    for (let i = 0; i < jsonData.length; i++) {
      const data = jsonData[i];
      console.log("Data:", data);
      const student = new Student(data);
      await student.save();
      console.log("Student saved:", student);
    }

    console.log("Database populated successfully.");
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

const excelFilePath = `${__dirname}/student-details/school-data.xlsx`;
populateDatabaseFromExcel(excelFilePath);

const upload = multer({ dest: "/multer" });

// Routes
app.get("/admin", function (req, res) {
  res.render("admin", { message: "" });
});

app.post("/admin", upload.single("file"), async function (req, res) {
  const username = req.body.username.trim();
  const password = req.body.password.trim();

  if (username === "PVN@admin" && password === "PVN@website") {
    if (req.file) {
      const newFilePath = "student-details/" + req.file.originalname;
      const previousFilePath = getLatestFilePath();

      if (previousFilePath) {
        fs.unlinkSync(previousFilePath);
      }

      fs.renameSync(req.file.path, newFilePath);
      res.render("admin", { message: "File uploaded successfully" });

      // Update the database with the new file
      try {
        await populateDatabaseFromExcel(newFilePath);
        console.log("Database updated successfully.");
      } catch (error) {
        console.error("Error updating database:", error);
      }
    } else {
      res.render("admin", { message: "No file uploaded" });
    }
  } else {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.render("admin", { message: "Invalid username or password" });
  }
});

function getLatestFilePath() {
  const directoryPath = "student-details/";
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
    return res.render("student-details", { studentDetails });

    // Rest of the code...
  } catch (error) {
    console.error("Error retrieving student details from the database:", error);
    return res.render("student-login", {
      message: "An error occurred. Please try again later.",
    });
  }
});

function sendEmail(content) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "pragathiutility@gmail.com", // replace with your email address
      pass: "tqbntkujmegkesmu", // replace with your email password
    },
  });

  const mailOptions = {
    from: "pragathiutility@gmail.com", // replace with your email address
    to: "pragathiutility@gmail.com", // replace with the recipient email address
    subject: "New Admission",
    text: content,
  };

  return transporter.sendMail(mailOptions);
}

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

app.post("/admission", function (req, res) {});

const access_token =
  "EAAXtoFVnzq8BAFsCeI9M3HMCtjSzVKy3LJdlCXtxPiVwmaW0g0jDZClxMBgr4SSimjiBLCsXnBYPp06cOXKyCwKRnrhZBxihajA82FyuSZCeFAKIdMZB3MPnc8CKeZBJqBR0hppSZBbf7sZAqcCCaxZAsEKl85ovq7tOg7hDJocLC572X7uPcGYt";

app.get("/gallery", function (req, res) {
  const facebook_url_endpoint =
    "https://graph.facebook.com/me/accounts/?fields=albums{id,name,photos{id,name,images}}&access_token=" +
    access_token;

  https.get(facebook_url_endpoint, function (response) {
    let chunks = "";

    response.on("data", function (chunk) {
      chunks += chunk;
    });

    response.on("end", function () {
      const facebookData = JSON.parse(chunks);
      const albums = facebookData.data[0].albums.data;
      res.render("gallery", { albums: albums });
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
    const circulars = await Circular.find();
    res.render("circulars", { circulars, message: "" });
  } catch (error) {
    console.error("Error retrieving circulars:", error);
    res.render("circulars", { circulars: [], message: "Error retrieving circulars" });
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
  if (req.session.teacher) {
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
      console.log("Circular saved:", circular);
      res.render("post-circular", { message: "Circular posted successfully" });
    } catch (error) {
      console.error("Error posting circular:", error);
      res.render("post-circular", { message: "Failed to post circular" });
    }
  } else {
    res.redirect("/teacher-login");
  }
});

app.listen(5500, function () {
  console.log("Server started at port 5500.");
});

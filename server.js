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
const { populateDatabaseFromExcel, getLatestFilePath , sendEmail} = require("./utils");
const PORT = process.env.PORT || 3030;

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

app.use(methodOverride("_method"));

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

const excelFilePath = `${__dirname}/student-details/school-data.xlsx`;
const upload = multer({ dest: `${__dirname}/multer` });

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
      const previousFilePath = getLatestFilePath("student-details/");

      if (previousFilePath) {
        fs.unlinkSync(previousFilePath);
      }

      fs.renameSync(req.file.path, newFilePath);
      res.render("admin", { message: "File uploaded successfully" });

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


app.post("/student-login", async (req, res) => {
  const aadharNumber = req.body.aadhar.replace(/\s/g, "");
  const password = req.body.password;

  
  populateDatabaseFromExcel(excelFilePath);

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

const access_token =
  "EAAXtoFVnzq8BAO6yzXdCX9hM7IcOGHTVZAKgjkb3j129m4cpk7tNUuDPP7RALPxZCmbGAEL0m3WNVUrj2cYZB5T0dwb1ODVmTj0UIwxRHXpkSAZCiUunVJDEi8TJTMVrlaVF9VSHSKF2hKgeOeYwJAYvnkZC1V38ujAu2hPcZBuKKUhOvuqVx6J2NylOBUzI9Qz3uoIUffn8iKZCm2vwpeG";

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
    console.log("Circular saved:", circular);

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

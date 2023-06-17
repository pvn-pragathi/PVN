const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const session = require("express-session");
const xlsx = require("xlsx");
const https = require("https");
const axios = require("axios");
const { log } = require("console");

// const facebook = new Facebook({
//   appId: '1668647766970031',
//   secret: '1feef404e27715163eb2da055d931b88',
// });

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

app.post('/student-login', async (req, res) => {
    const aadharNumber = req.body.aadhar.replace(/\s/g, '');
    let headers;
  
    try {
      const workbook = xlsx.readFile('school-data.xlsx');
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rangeValues = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
      // Find the Aadhar column index
      headers = rangeValues[1];
      const aadharColumnIndex = headers.findIndex(header => header.toLowerCase() === 'aadhar no');
  
      if (aadharColumnIndex === -1) {
        console.log('Aadhar column not found in school data. Please check the Excel file.');
        res.render('student-login', { message: 'Aadhar column not found in school data. Please check the Excel file.' });
        return;
      }
  
      let rowIndex = -1;
      let studentDetails = {};
  
      // Find the row with the matching Aadhar number
      for (let i = 2; i < rangeValues.length; i++) {
        const row = rangeValues[i];
        const cellValue = row[aadharColumnIndex];
  
        if (cellValue && cellValue.toString().replace(/\s/g, '') === aadharNumber) {
          rowIndex = i;
          break;
        }
      }
  
      if (rowIndex === -1) {
        console.log('Aadhar number not found in school data. Please update your Aadhar number in school data.');
        res.render('student-login', { message: 'Aadhar number not found in school data. Please update your Aadhar number in school data.' });
        return;
      }
  
      // Create student details object
      headers.forEach((header, index) => {
        studentDetails[header] = rangeValues[rowIndex][index];
      });
  
      console.log('Student Details:', studentDetails);
      res.render('student-details', { studentDetails });
  
      // Rest of the code...
  
    } catch (error) {
      console.error('Error reading the Excel file:', error);
      res.render('student-login', { message: 'An error occurred. Please try again later.' });
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

const access_token = "EAAXtoFVnzq8BALRp1Q67do1dqg79FDTSXuSn6q9l3XcXyOwdLuzEv98ZBc6fikYCEkD2anp79Gwx1x6ZAcLu9H2Bg43bZBchA2W4CgLizE3dHfQcw6S9fZAY7DdMSab7GnZA6daZB2Y0nnoh6ZAuwSp8PThZCBmRKUDqAeypnPFu3vGkQqVHXG47";

app.get("/gallery", function (req, res) {
  const facebook_url_endpoint =
    "https://graph.facebook.com/me/accounts/?fields=albums{id,name,photos{id,name,picture}}&access_token=" + access_token;

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

app.get("/calendar", function (req, res) {
  res.render("calendar");
});

app.get("/circulars", function (req, res) {
  res.render("circulars");
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

app.listen(5500, function () {
  console.log("Server started at port 5500.");
});

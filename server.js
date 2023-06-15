const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require('nodemailer');
const session = require("express-session")
const xlsx = require("xlsx-populate");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));
app.use(session({
    secret: 'PRAGATHI12345',
    resave: false,
    saveUninitialized: true
}));

app.post("/admission", function(req, res){
    const formData = req.body;
    const formattedData = `Name: ${formData.studentname}\nMother Name: ${formData.mothername}\nFather Name: ${formData.fathername}\nStudent age: ${formData.age}\nDOB: ${formData.dob}\nGender: ${formData.gender}\nAdmission Class: ${formData.admissioninto}\nAddress: ${formData.address}\nAadhar No: ${formData.aadhar}\nContact-1: ${formData.contact1}\nContact-2: ${formData.contact2}`;

    sendEmail(formattedData)
        .then(() => {
            req.session.submitted = true;
            res.redirect('/admission');
        })
        .catch((error) => {
            console.error('Error sending email:', error);
            req.session.error = true;
            res.redirect('/admission');
        });
});


// Route handler for form submission
app.post('/student-login', async (req, res) => {
  const aadharNumber = req.body.aadhar.replace(/\s/g, ''); // Get the Aadhar number from the form input and remove whitespace

  try {
    // Read the Excel file
    const workbook = await xlsx.fromFileAsync('login.xlsx');
    const worksheet = workbook.sheet(0);

    // Get the used range of the worksheet
    const usedRange = worksheet.usedRange();

    const rangeValues = usedRange.value();
    const headers = rangeValues[0]; // Assume the headers are in the first row

    const aadharColumnIndex = headers.findIndex(header => header.toLowerCase() === 'aadhar card number');
    if (aadharColumnIndex === -1) {
      res.render('student-login', { message: 'Invalid Excel file format. Aadhar column not found.' });
      return;
    }

    const aadharValues = [];
    rangeValues.slice(1).forEach(row => {
      const cellValue = row[aadharColumnIndex];
      if (cellValue) {
        aadharValues.push(cellValue.toString().replace(/\s/g, ''));
      }
    });

    const rowIndex = aadharValues.findIndex(value => value === aadharNumber);
    if (rowIndex === -1) {
      res.render('student-login', { message: 'Invalid Aadhar number. Please try again.' });
      return;
    }

    // Retrieve the student details from the corresponding row
    const studentDetails = {};
    headers.forEach((header, index) => {
      studentDetails[header] = rangeValues[rowIndex + 1][index];
    });

    res.render('student-details', { student: studentDetails });
  } catch (error) {
    console.error('Error reading the Excel file:', error);
    res.render('student-login', { message: 'An error occurred. Please try again later.' });
  }
});

  
  

  


  
  
  
  

function sendEmail(content) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'pragathiutility@gmail.com', // replace with your email address
            pass: 'tqbntkujmegkesmu' // replace with your email password
        }
    });

    const mailOptions = {
        from: 'pragathiutility@gmail.com', // replace with your email address
        to: 'pragathiutility@gmail.com', // replace with the recipient email address
        subject: 'New Admission',
        text: content
    };

    return transporter.sendMail(mailOptions);
}


app.get("/", function(req, res){
    res.render("index");
});

app.get("/about", function(req, res){
    res.render("about");
});

app.get("/contact", function(req, res){
    res.render("contact");
});

app.get('/admission', function(req, res) {
    const submitted = req.session.submitted;
    const error = req.session.error;
    delete req.session.submitted;
    delete req.session.error;
    res.render('admission', { submitted, error });
});

app.get("/gallery", function(req, res){
    res.render("gallery");
});

app.get("/fee", function(req, res){
    res.render("fee");
});

app.get("/calendar", function(req, res){
    res.render("calendar");
});

app.get("/circulars", function(req, res){
    res.render("circulars");
});

app.get("/ssc-results", function(req, res){
    res.render("ssc-results");
});

app.get("/rules", function(req, res){
    res.render("rules");
});

app.get('/student-login', (req, res) => {
    res.render('student-login', { message: '' });
});



app.listen(5500, function(){
    console.log("Server started at port 5500.");
});
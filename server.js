const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require('nodemailer');
const session = require("express-session")

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

app.get("/student-login", function(req, res){
    res.render("student-login");
});



app.listen(5500, function(){
    console.log("Server started at port 5500.");
});
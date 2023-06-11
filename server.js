const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

app.get("/", function(req, res){
    res.render("index")
});

app.get("/about", function(req, res){
    res.render("about")
});

app.get("/contact", function(req, res){
    res.render("contact")
});

app.get("/admission", function(req, res){
    res.render("admission")
});

app.get("/gallery", function(req, res){
    res.render("gallery")
});

app.get("/fee", function(req, res){
    res.render("fee")
});

app.get("/calendar", function(req, res){
    res.render("calendar")
});

app.get("/circulars", function(req, res){
    res.render("circulars")
});

app.get("/student-login", function(req, res){
    res.render("student-login")
});



app.listen(5500, function(){
    console.log("Server started at port 5500.");
});
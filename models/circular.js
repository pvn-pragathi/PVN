// circular.js
const mongoose = require("mongoose");

const circularSchema = new mongoose.Schema({
    title: String,
    classes: [String],
    date: String,
    day: String,
    content: String,
  });
  
const Circular = mongoose.model("Circular", circularSchema);

module.exports = Circular;

const mongoose = require("mongoose");
const marked = require("marked");

const circularSchema = new mongoose.Schema({
  title: String,
  classes: [String],
  date: String,
  day: String,
  content: String,
});

// Pre-save hook to convert content to Markdown before saving to the database
circularSchema.pre("save", function (next) {
  if (this.content) {
    this.content = marked(this.content);
  }
  next();
});

const Circular = mongoose.model("Circular", circularSchema);

module.exports = Circular;

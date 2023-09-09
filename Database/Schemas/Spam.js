const mongoose = require("mongoose");

const Spam = new mongoose.Schema({
  Guild: String,
  User: String,
  InfractionPoints: Number,
});

module.exports = mongoose.model("spam", Spam);

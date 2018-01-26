const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const randomMessageSchema = new Schema({
  from: { type: String },
  to: { type: String },
  people: [],
  message: { type: String },
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Random-message", randomMessageSchema);

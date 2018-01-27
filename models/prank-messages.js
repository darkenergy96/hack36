const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const prankMessageSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const PrankMessage = mongoose.model("PrankMessage", prankMessageSchema);
module.exports = PrankMessage;

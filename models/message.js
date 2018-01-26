const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  from: { type: String },
  to: { type: String },
  people: [],
  message: { type: String },
  date: { type: Date, default: Date.now },
  private: { type: Boolean, default: false }
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;

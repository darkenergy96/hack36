const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  people: [],
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
  private: { type: Boolean, default: false }
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;

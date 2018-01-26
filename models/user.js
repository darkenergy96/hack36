const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  gender: { type: String, required: true },
  birthday: { type: String, required: true },
  token: { type: String, required: true },
  friends: [{ name: String, id: String }],
  friendsCount: { type: Number, default: 0 },
  randomChat: { with: { type: String }, startdate: { type: Date } }
});
const User = mongoose.model("User", userSchema);
module.exports = User;

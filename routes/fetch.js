const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");
//fetch messages with a friend
router.get("/chat/:friendId", (req, res) => {
  let { id } = req.body;
  let { friendId } = req.params;
  Message.find({ people: { $all: [id, friendId] } }, (err, msgs) => {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }
    res.json(msgs);
  });
});

module.exports = router;

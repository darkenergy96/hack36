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

//Is pranking others?
router.get("/prank-status", (req, res, next) => {
  const { id } = req.body;
  const projection = {
    _id: 0,
    prankStatus: 1
  };
  User.findOne({ id }, (err, user) => {
    if (err) {
      next(err);
    } else {
      res.json(user);
    }
  });
});
module.exports = router;

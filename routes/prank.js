const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");
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

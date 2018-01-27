const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user.js");
const AMessage = require("../models/anonymous-message");

router.get("/random-chat-data/:id", (req, res) => {
  let { id } = req
    .params(async () => {
      const user = await User.findOne({ id });
      res.json(user.randomChat);
    })()
    .catch(err => {
      next(err);
    });
});

//random chat messages
router.get("/random-chat", (req, res) => {
  console.log("requested: ", req.url);
  //url format /random-chat?person=shshhshsh&friend=shshshhs&skip=0
  const { person, friend, skip } = req.query;
  if (!person || !friend || !skip) {
    return res.status(400).send("server response:Invalid query parameters!!");
  }
  let skipCount = Number(skip);
  const dbQuery = {
    people: { $all: [person, friend] }
  };
  console.log(dbQuery);
  const projection = {
    _id: 0,
    __v: 0,
    private: 0
  };
  //limit to 20 msgs
  AMessage.find(dbQuery)
    .select(projection)
    .skip(skipCount)
    .limit(20)
    .exec((err, msgs) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else res.json(msgs);
    });
});
module.exports = router;

const express = require("express");
const router = express.Router();
const util = require("util");
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");

router.post("/user-details", (req, res, next) => {
  User.findOne({ id: req.body.id }, (err, user) => {
    let { body } = req;
    if (err) throw err;
    if (!user) {
      let user = new User({
        id: body.id,
        name: body.name,
        email: body.email,
        gender: body.gender,
        birthday: body.birthday,
        friends: body.friends.data,
        token: body.token,
        friendsCount: body.friends.summary.total_count
      });
      user.save((err, user) => {
        if (err) {
          next(err);
        }
        console.log("user saved " + user.name);
        return res.sendStatus(200);
      });
    }
    if (user) {
      let query = { id: req.body.id };
      let update = {
        friends: body.friends.data,
        token: body.token,
        friendsCount: body.friends.summary.total_count
      };
      User.findOneAndUpdate(query, update, function(err, user) {
        if (err) return res.send(500, { error: err });
        console.log("user updated " + user.name);
        return res.sendStatus(200);
      });
    }
  });
  // console.log(util.inspect(req.body, { showHidden: false, depth: null }));
});
router.get("/:userId/random-chat", (req, res) => {
  let id = req.params.userId;
  User.findOne({ id: id })
    .select("friends -_id")
    .exec((err, friends) => {
      if (err) res.status(500).send(err);
      else {
        let random_friend =
          friends.friends[Math.floor(Math.random() * friends.friends.length)];

        console.log(random_friend.name);
      }
    });
});
router.get("/:userId/friends", (req, res) => {
  let id = req.params.userId;
  //   console.log("requested for friends");
  User.findOne({ id: id })
    .select("friends prankDetails -_id")
    .exec((err, friends) => {
      if (err) res.status(500).send(err);
      else res.status(200).send(friends);
    });
});
router.get("/global-msgs", (req, res) => {
  const { skip } = req.query;
  if (!skip) {
    return res.status(400).send("server response:Invalid query parameters!!");
  }
  const skipCount = Number(skip);
  //global chat
  const projection = {
    _id: 0,
    __v: 0,
    private: 0
  };
  Message.find({ private: false })
    .select(projection)
    .skip(skipCount)
    .limit(20)
    .exec((err, msgs) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } else res.json(msgs);
    });
});
router.get("/private-msgs", (req, res) => {
  //not tested
  //url format /private-msgs?person=shshhshsh&friend=shshshhs&skip=0
  const { person, friend, skip } = req.query;
  if (!person || !friend || !skip) {
    return res.status(400).send("server response:Invalid query parameters!!");
  }
  let skipCount = Number(skip);
  const dbQuery = {
    $or: [
      { from: person, to: friend, private: true },
      { from: friend, to: person, private: true }
    ]
  };
  const projection = {
    _id: 0,
    __v: 0,
    private: 0
  };
  //limit to 20 msgs
  Message.find(dbQuery)
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

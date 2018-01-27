const express = require("express");
const router = express.Router();
const util = require("util");
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");
const rclient = require("./socket.js");
router.post("/user-details", (req, res, next) => {
  console.log("test", req.body.deviceToken);
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
        friendsCount: body.friends.summary.total_count,
        deviceToken: body.deviceToken
      });
      user.save((err, user) => {
        if (err) {
          next(err);
        }
        console.log("user saved " + user.name + user.deviceToken);
        return res.sendStatus(200);
      });
    }
    if (user) {
      let query = { id: req.body.id };
      let update = {
        friends: body.friends.data,
        token: body.token,
        friendsCount: body.friends.summary.total_count,
        deviceToken: body.deviceToken
      };
      User.findOneAndUpdate(query, update, function(err, user) {
        if (err) return res.send(500, { error: err });
        console.log("user updated " + user.name + user.deviceToken);
        return res.sendStatus(200);
      });
    }
  });
  // console.log(util.inspect(req.body, { showHidden: false, depth: null }));
});
// random chat will be edited by SUMANTH
router.get("/:userId/random-chat", (req, res) => {
  let id = req.params.userId;
  User.findOne({ id: id }, (err, user) => {
    if (err) console.log("User find error", err);
    else {
      let friends = user.friends;
      let onlineFriends = [];
      // friends.forEach(friend => {
      //     rclient.get(friend.id,(err,reply)=>{
      //         if(reply){
      //           onlineFriends.push(friend);
      //         }
      //     });
      // });
      if (onlineFriends.length > 0) {
        let random_friend =
          onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
        // do something SUMANTH
      }
    }
  });
  //   User.findOne({ id: id }).exec((err, user) => {
  //     if (err) res.status(500).send(err);
  //     else {
  //       let random_friend =
  //         user.friends[Math.floor(Math.random() * friends.friends.length)];
  //       user.randomChat = {
  //         with: random_friend.id,
  //         startdate: Date.now()
  //       };
  //       user.save((err, user) => {
  //         if (err) return res.send(500, { error: err });
  //         console.log("random assigned " + user.name);
  //         return res.sendStatus(200);
  //       });
  //       console.log(random_friend.name);
  //     }
  //   });
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

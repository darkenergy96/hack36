const express = require("express");
const app = express();
const router = express.Router();
const http = require("../server.js");
const io = require("socket.io")(http);
const util = require("util");
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");
const redis = require("redis");
const redisOptions = { host: "localhost", port: 6379 };
const rclient = redis.createClient(redisOptions);
rclient.on("connect", () => {
  console.log("connected to redis");
});
module.exports = rclient;
let userCount = 0;
let socketHandler = function(socket) {
  socket.on("disconnect", function() {
    userCount--;
    rclient.get(socket.id, (err, userId) => {
      rclient.del(userId);
      rclient.del(socket.id);
    });
    console.log("user disconnected: ", userCount);
  });
  userCount++;
  console.log("Connected Online: " + userCount);

  socket.on("authentication", data => {
    if (!data.id) {
      //If failed to authenticate return here
      socket.emit("failed");
      return;
    }
    let fbId = data.id;
    let sSocketId = socket.id;
    console.log(`${fbId} dataId ${sSocketId} SocketId`);
    rclient.set(fbId, sSocketId);
    rclient.set(sSocketId, fbId);
    socket.emit("authenticated");
    socket.on("message", (data, fn) => {
      fn("sent");
      let message = new Message({
        from: data.from,
        to: data.to,
        message: data.message
      });
      message.save((err, message) => {
        if (err) return 500, { error: err };
        console.log("message saved");
      });
      io.emit("message", data);
      console.log("message" + data.message);
    });
    socket.on("private", data => {
      let message = new Message({
        from: data.from,
        to: data.to,
        message: data.message,
        private: true
      });
      console.log(data.to + " to id");
      message.save((err, message) => {
        if (err) return 500, { error: err };
        console.log("private message saved " + message.message);
      });
      rclient.get(data.to, (err, reply) => {
        socket.to(reply).emit("private", data);
        socket.to(data.from).emit("private", data);
      });
    });
    //request prank
    socket.on("request-prank", data => {
      const { from, to } = data;
      rclient.get(data.to, (err, socketId) => {
        if (err) console.log(err);
        socket.to(socketId).emit("request-prank", from);
      });
    });
    // random chat
    router.post("/:userId/random-chat", (req, res) => {
      let id = req.params.userId;
      User.findOne({ id: id }, (err, user) => {
        if (err) console.log("User find error", err);
        else {
          let friends = user.friends;
          let onlineFriends = [];
          //   let promiseArray = [];
          let rclientPromise = util.promisify(rclient.get);
          // friends.forEach(friend => {
          //   promiseArray.push(rclientPromise(friend.id));
          // });
          // (async () => {
          //   for await (const reply of promiseArray) {
          //     console.log(reply);
          //     onlineFriends.push(friends[index]);
          //     index++;
          //   }
          // })().catch(err => {
          //   console.log(err);
          // });
          (async () => {
            for (const friend of friends) {
              const id = await rclientPromise(friend.id);
              console.log(id);
              onlineFriends.push(id);
            }
          })()
            .catch(err => {
              console.log(err);
            })
            .then(() => {
              if (onlineFriends.length > 0) {
                let random_friend =
                  onlineFriends[
                    Math.floor(Math.random() * onlineFriends.length)
                  ];
                if (random_friend) {
                  (async () => {
                    let random_friend_socketId = await rclientPromise(
                      random_friend.id
                    );
                    return random_friend_socketId;
                  })()
                    .catch(err => {
                      console.log(`rondom friend socketId fetch error: ${err}`);
                    })
                    .then(socketId => {
                      res.sendStatus(200);
                      console.log(`random assign socketId: ${socketId}`);
                    });
                }
              }
            });

          //rclient.get(friend.id,(err,reply)=>{
          //         if(reply){
          //           onlineFriends.push(friend);
          //         }
          //     });
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
  });
};
io.on("connection", socketHandler);
module.exports = router;

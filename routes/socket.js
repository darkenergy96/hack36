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
      console.log("private event triggered");
      console.log(data);
      let message = new Message({
        from: data.fromId,
        to: data.to,
        message: data.message,
        private: true,
        people: [data.fromId, data.to]
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
    //on random chat request
    socket.on("random-chat-request", data => {
      console.log("socket on random-chat-request");
      // random chat
      let id = data;
      User.findOne({ id }, (err, user) => {
        if (err) console.log("User find error", err);
        else {
          let friends = user.friends;
          let onlineFriends = []; //socket ids
          let rclientPromise = util.promisify(rclient.get).bind(rclient);
          (async () => {
            for (const friend of friends) {
              const socketId = await rclientPromise(friend.id);
              onlineFriends.push(socketId);
            }
          })()
            .catch(err => {
              console.log(err);
              console.log("error thrown here");
            })
            .then(() => {
              if (onlineFriends.length > 0) {
                let friendSocketId =
                  onlineFriends[
                    Math.floor(Math.random() * onlineFriends.length)
                  ];
                console.log(friendSocketId);
                socket.to(friendSocketId).emit("random-chat-request");
                /////////////////////////////
                // (async () => {
                //   let random_friend_socketId = await rclientPromise(
                //     random_friend
                //   );
                //   return random_friend_socketId;
                // })()
                //   .catch(err => {
                //     console.log(`rondom friend socketId fetch error: ${err}`);
                //   })
                //   .then(socketId => {
                //     console.log(`random assign socketId: ${socketId}`);
                //   });
              } else {
                let random_friend =
                  user.friends[
                    Math.floor(Math.random() * onlineFriends.length)
                  ];
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

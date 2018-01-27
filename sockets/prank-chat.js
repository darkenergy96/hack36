const util = require("util");
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");
const fcm = require("../push-notification.js");

function prankSocketHandler(socket, rclient) {
  //request prank
  socket.on("request-prank", data => {
    const { from, to } = data;
    rclient.get(data.to, (err, socketId) => {
      if (err) console.log(err);
      socket.to(socketId).emit("request-prank", from);
    });
  });
  //prank-chat event
  socket.on("prank-chat", data => {
    console.log("prank-chat socket event listen");
    let rclientPromise = util.promisify(rclient.get).bind(rclient);
    (async () => {
      const prank_socketId = await rclientPromise(data.toId);
      return prank_socketId;
    })()
      .catch(err => {
        console.log(err);
        console.log(`prank_socketId fine error`);
      })
      .then(socketId => {
        if (socketId) {
          socket.to(socketId).emit("prank-chat", data);
        }
      });
  });
  //prank-chat confirmation
  socket.on("prank-chat-confirmation", data => {
    User.findOne({ id: data.fromId }, (err, user) => {
      user.prankDetails = {
        friendId: data.toId,
        name: data.toName,
        status: true
      };
      user.save((err, user) => {
        if (err) console.log(`user save error : ${err}`);
        console.log("user updated");
      });
    });
  });
}
module.exports = prankSocketHandler;

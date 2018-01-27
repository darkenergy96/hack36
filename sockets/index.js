const express = require("express");
const app = express();
const router = express.Router();
const http = require("../server.js");
const io = require("socket.io")(http, {
  pingInterval: 2000,
  pingTimeout: 3000
});
const util = require("util");
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");
const redis = require("redis");
const localRedisOptions = { host: "localhost", port: 6379 };
const cloudRedisOptions = {
  host: "redis-14006.c9.us-east-1-2.ec2.cloud.redislabs.com",
  port: 14006
};
const redisOptions = process.env.DEV ? localRedisOptions : cloudRedisOptions;
const rclient = redis.createClient(redisOptions);
const anonymousSockets = require("./anonymous");
const prankChat = require("./prank-chat");
rclient.on("connect", () => {
  // module.exports.rclient = rclient;
  console.log("connected to redis");
});
let userCount = 0;
let socketHandler = function(socket) {
  socket.on("disconnect", function() {
    userCount--;
    rclient.get(socket.id, (err, userId) => {
      rclient.del(userId, (err, res) => {
        if (err) console.log(`redis delete error: ${err}`);
        else {
          if (res == 1) console.log("userId deleted from redis");
          else console.log("cannot delete userId from redis");
        }
      });
      rclient.del(socket.id, (err, res) => {
        if (err) console.log(`redis delete error: ${err}`);
        else {
          if (res == 1) console.log("socketId deleted from redis");
          else console.log("cannot delete socketId from redis");
        }
      });
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
      socket.broadcast.emit("message", data);
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
    prankChat(socket, rclient);
    anonymousSockets(socket, rclient);
  });
};
io.on("connection", socketHandler);
module.exports.router = router;

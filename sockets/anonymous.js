const util = require("util");
const mongoose = require("mongoose");
const User = require("../models/user.js");
const AMessage = require("../models/anonymous-message.js");
// const rclient = require("./index").rclient;
const fcm = require("../push-notification.js");
function socketHandler(socket, rclient) {
  let rclientPromise = util.promisify(rclient.get).bind(rclient);
  //on random chat request
  socket.on("random-chat-request", data => {
    console.log("requester", data);
    console.log("socket on random-chat-request");
    // random chat
    let id = data;
    User.findOne({ id }, (err, user) => {
      if (err) console.log("User find error", err);
      else {
        let friends = user.friends;
        let onlineFriends = []; //socket ids

        (async () => {
          for (const friend of friends) {
            const socketId = await rclientPromise(friend.id);
            if (socketId !== null) {
              onlineFriends.push(socketId);
            }
          }
        })()
          .catch(err => {
            console.log(err);
            console.log("error thrown here");
          })
          .then(() => {
            if (onlineFriends.length > 0) {
              let friendSocketId =
                onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
              console.log("emit to", friendSocketId);
              socket.to(friendSocketId).emit("random-chat-request", id);
              //fcm push notification
              (async () => {
                let friendId = await rclientPromise(friendSocketId);
                return friendId;
              })()
                .catch(err => {
                  console.log(err);
                  console.log(`friendId found error`);
                })
                .then(friendId => {
                  user.randomChat.with = friendId;
                  user.randomChat.status = "pending";
                  user.save(err => {
                    console.log(err);
                  });
                  // let deviceToken = User.findOne(
                  //   { id: friendId },
                  //   (err, user) => {
                  //     if (err) console.log(`user find error ${err}`);
                  //     let message = {
                  //       to: user.deviceToken,
                  //       data: {
                  //         title: "Anonymous Chat request",
                  //         body: "One of your friend wants to chat anonymously"
                  //       }
                  //     };
                  //     fcm.send(message, (err, res) => {
                  //       if (err)
                  //         console.log(
                  //           `something worng with Push Notification: ${err}`
                  //         );
                  //       else console.log("push-notification successful");
                  //     });
                  //   }
                  // );
                });
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
                user.friends[Math.floor(Math.random() * onlineFriends.length)];
              console.log(`random friend assigned ${random_friend.name}`);
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
  //accept random-chat
  socket.on("random-chat-accept", data => {
    console.log("accept random chat");
    let id = data; //who accepts
    (async () => {
      let user = await User.findOne({ "randomChat.with": id });
      if (user) {
        //who sends initially
        //start random chat
        const newRandomChatDetails = {
          with: id,
          startDate: Date.now,
          status: "active"
        };
        user.randomChat = newRandomChatDetails;
        let savedUser = await user.save();
        let currentUser = await User.findOne({ id });
        currentUser.randomChat = newRandomChatDetails;
        let savedCurrentUser = await currentUser.save();
        //now emit
        let socketId = await rclientPromise(savedUser.id);
        let sid = await rclientPromise(savedCurrentUser.id);
        console.log("sid", socket.id);
        console.log("socketid before", socketId);
        // socket.emit("random-chat-start");

        socket.to(socketId).emit("random-chat-start", id);
        socket.to(socket.id).emit("random-chat-start", savedUser.id);
      } else {
        console.log("no user");
      }
    })().catch(err => {
      console.log(err);
    });
  });
  //reject random-chat
  socket.on("random-chat-reject", data => {
    let id = data;
    console.log("random chat reject");
  });
  //on random-chat message
  socket.on("random-chat-msg", data => {
    console.log("msg", data);
    let message = new AMessage({
      from: data.from,
      to: data.to,
      message: data.message,
      people: [data.from, data.to]
    });
    message.save((err, msg) => {
      if (err) next(err);
      else {
        rclient.get(data.to, (err, socketId) => {
          if (err) {
            console.log(err);
          } else {
            socket.to(socketId).emit("random-chat-msg", msg);
          }
        });
      }
    });
  });
}
module.exports = socketHandler;

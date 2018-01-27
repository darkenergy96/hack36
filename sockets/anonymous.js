const util = require("util");
const mongoose = require("mongoose");
const User = require("../models/user.js");
const Message = require("../models/message.js");
// const rclient = require("./index").rclient;
const fcm = require("../push-notification.js");
function socketHandler(socket, rclient) {
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
              console.log(friendSocketId);
              socket.to(friendSocketId).emit("random-chat-request");
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
                  let deviceToken = User.findOne(
                    { id: friendId },
                    (err, user) => {
                      if (err) console.log(`user find error ${err}`);
                      let message = {
                        to: user.deviceToken,
                        data: {
                          title: "Anonymous Chat request",
                          body: "One of your friend wants to chat anonymously"
                        }
                      };
                      fcm.send(message, (err, res) => {
                        if (err)
                          console.log(
                            `something worng with Push Notification: ${err}`
                          );
                        else console.log("push-notification successful");
                      });
                    }
                  );
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
}
module.exports = socketHandler;

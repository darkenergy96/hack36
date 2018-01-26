const express = require("express");
const app = express();
const http = require("http").Server(app);
module.exports = http;
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const socketData = require("./routes/socket.js");
const Routes = require("./routes/routes.js");
mongoose.Promise = global.Promise;
const mongoURL = "mongodb://localhost:27017/socio";
mongoose.connect(mongoURL);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(Routes);
app.use(socketData);
app.use(express.static(path.join(__dirname, "public")));
app.get("/", function(req, res) {
  res.send("Hack36 Home page");
});
const db = mongoose.connection;
// When successfully connected
db.on("connected", function() {
  console.log("mongoose connected");
});
// If the connection throws an error
db.on("error", function(err) {
  console.log("mongoose connection error: " + err);
});
// When the connection is disconnected
db.on("disconnected", function() {
  console.log("mongoose disconnected");
});
// If the Node process ends, close the Mongoose connection
process.on("SIGINT", function() {
  mongoose.connection.close(function() {
    console.log(
      "Mongoose default connection disconnected through app termination"
    );
    process.exit(0);
  });
});
const port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log(`server running on port: ${port}`);
});

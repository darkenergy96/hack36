require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").Server(app);
module.exports = http;
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const socketData = require("./sockets/index.js").router;
const Routes = require("./routes/routes.js");
const fetchRoutes = require("./routes/fetch");
const prankRoutes = require("./routes/prank");
const errorHandler = require("./error-handler");
mongoose.Promise = global.Promise;
const localURL = "mongodb://localhost:27017/socio";
const atlasURL =
  "mongodb://chan-socio:zAIs1lCkGFso0a01@sociointegrate-shard-00-00-2xa6g.mongodb.net:27017,sociointegrate-shard-00-01-2xa6g.mongodb.net:27017,sociointegrate-shard-00-02-2xa6g.mongodb.net:27017/test?ssl=true&replicaSet=sociointegrate-shard-0&authSource=admin";
const dbURL = process.env.DEV ? localURL : atlasURL;
mongoose.connect(dbURL);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(Routes);
app.use(socketData);
app.use(fetchRoutes);
app.use(prankRoutes);
app.use(express.static(path.join(__dirname, "public")));
app.use(errorHandler);
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

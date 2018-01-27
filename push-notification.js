const FCM = require("fcm-push");
const serverkey =
  "AAAAJUSwLao:APA91bH18s2IODpMORpVa4Kw-Q9Mn8UcD7TsY-gd6LeJlYNbAQz7wET06fWNg5x47alN0oZUudOeKEh6Z2yNlYiX2QYjHn9NbQxFx76l30sTF3eT3UeFu3trOxBTDqwNuKou9vsJ_GtI";
const fcm = new FCM(serverkey);
module.exports = fcm;

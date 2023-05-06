const express = require("express");
const bodyParser = require("body-parser");
const route = require("./user.routes");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(route);

app.get("/", (req, res) => {
  res.send("<div><h1>Server is Running</h1></div>");
});

var port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("User service is Running on " + port);
});

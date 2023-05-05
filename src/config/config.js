const { connect } = require("mongoose");
const dbConnectionString = process.env.DB_CONNECTION_STRING;

connect(dbConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Database Connected");
  })
  .catch((e) => {
    console.log("Database Connection", e);
  });

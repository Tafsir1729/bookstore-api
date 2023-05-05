const winston = require("winston");
const { MongoClient } = require("mongodb");
const MongoDBTransport = require("winston-mongodb").MongoDB;
const dbConnectionString = process.env.DB_CONNECTION_STRING;

const client = new MongoClient(dbConnectionString, {
  useUnifiedTopology: true,
});
client.connect();

const logger = winston.createLogger({
  level: "info",
  transports: [
    new MongoDBTransport({
      db: client.db("bookstore"),
      collection: "logs",
      options: { useUnifiedTopology: true },
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] }),
    winston.format.printf((info) => {
      const metadata = info.metadata || {};
      return `[${info.timestamp}] [${info.level}] ${info.message} - service: ${metadata.service}, controller: ${metadata.controller}, method: ${metadata.method}`;
    })
  ),
});

module.exports = { logger };

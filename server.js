/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Handling Synchronous Error (Last Safety Net)
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION: Server shutting down...");
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

dotenv.config({ path: "./config.env" }); //reading the environment variable

const app = require("./app");

// connection string ada disini
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
).replace("<DATABASE_NAME>", process.env.DATABASE_NAME);

const port = 3000;
// connect to connection string
// sejenis ketetapan dalam mengatasi mongoDB
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  }) // .connect akan menghasilkan promise.
  .then(() => console.log(`DB connection successful...`));

const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

// Handling Asynchronous Error (Last Safety Net)
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION: Server shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

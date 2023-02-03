const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");

dotenv.config({ path: "./config.env" });

// connection string ada disini
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
).replace("<DATABASE_NAME>", process.env.DATABASE_NAME);

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

// READING THE DATA
const dataTour = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, "utf-8")
);
const dataUser = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, "utf-8")
);
const dataReview = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

// IMPORT DATA INTO DATABASE
const importData = async () => {
  try {
    await Tour.create(dataTour);
    await User.create(dataUser, { validateBeforeSave: false });
    await Review.create(dataReview);
    console.log("Import Data Success");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE DATA IN THE DATABASE COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Delete Data Success");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// running comand line
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}

// node dev-data/data/import-dev-data.js --import
// node dev-data/data/import-dev-data.js --delete

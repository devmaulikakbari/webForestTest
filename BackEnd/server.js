const mongoose = require("mongoose");

mongoose
  .connect(`${process.env.MONGO_URL}`)
  .then(() => {
    console.log("Connection is successfull");
  })
  .catch((err) => {
    console.log("No connection");
  });

const mongoose = require("mongoose");
const favouriteSchema = new mongoose.Schema({
  islike: {
    type: Boolean,
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "UserDetail",
  },
  repo_id: {
    type: Number,
  },
});

const favourite = new mongoose.model("favourite", favouriteSchema);
module.exports = favourite;

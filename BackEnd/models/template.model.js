const mongoose = require("mongoose");
const templateSchema = new mongoose.Schema({
  body: {
    type: String,
  },
  template_name: {
    type: String,
  },
});

const template = new mongoose.model("Template", templateSchema);
module.exports = template;

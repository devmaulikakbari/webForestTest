const templateSchema = require("../../models/template.model");

exports.emailTemplate = async (whereCondition) => {
  try {
    const findTemp = await templateSchema.findOne(whereCondition);
    return findTemp;
  } catch (error) {
    throw error;
  }
};

exports.createTemplate = async (data) => {
  try {
    const tempData = new templateSchema(data)
    await tempData.save();
  } catch (err) {
    throw new Error(err);
  }
};
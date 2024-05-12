const favouriteSchema = require("../../models/favourite.model");

exports.createFavourite = async (data) => {
  try {
    const favouriteData = new favouriteSchema(data);
    await favouriteData.save();
  } catch (err) {
    throw new Error(err);
  }
};

exports.favouriteUpdate = async (updateData, whereCondition) => {
  try {
    await favouriteSchema.updateMany(
      whereCondition,
      { $set: updateData }
    );
  } catch (err) {
    throw new Error(err);
  }
};

exports.getFavourite = async (whereCondition) => {
  try {
    return await favouriteSchema.find(whereCondition);
  } catch (err) {
    throw err;
  }
};
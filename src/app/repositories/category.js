const categoryModel = require('../models/category')

const find = () => categoryModel.find()

const findOne = filter => categoryModel.findOne(filter)

const register = category => categoryModel.create(category)

const update = ({ categoryId, propName, propValue }) => categoryModel.updateOne(
  { _id: categoryId },
  { $addToSet: { [propName]: { $each: propValue } }, updateAt: Date.now() },
  { new: true }
)

const updateField = ({ categoryId, field }) => categoryModel.updateOne(
  { _id: categoryId, 'fields.name': field.name },
  { 'fields.$.options': field.options, updateAt: Date.now() },
  { new: true }
)

module.exports = {
  find,
  findOne,
  register,
  update,
  updateField
}

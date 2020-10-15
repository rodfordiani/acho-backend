const objectModel = require('../models/object')
const { objectStatus } = require('../../config/enum')

const register = object => objectModel.create(object)

const find = filter => {
  const { foundDate, category, type, text } = filter

  return objectModel.find(
    { category, type, foundDate: { $gte: foundDate }, $text: { $search: text } },
    { score: { $meta: 'textScore' }, applicant: 0 }
  ).populate('institution', '-password')
    .sort({ score: { $meta: 'textScore' } })
}

const addSolicitation = (id, data) => objectModel.updateOne(
  { _id: id, status: { $ne: objectStatus.DEVOLVED } },
  { status: objectStatus.SOLICITADED, ...data }
)

const findById = async id => objectModel.findById(id)

const devolve = id => objectModel.updateOne(
  { _id: id, status: objectStatus.SOLICITADED },
  { status: objectStatus.DEVOLVED, devolvedAt: Date.now() }
)

const update = (institutionId, { _id, ...data }) => objectModel.findOneAndUpdate(
  { _id, institution: institutionId, status: { $ne: objectStatus.DEVOLVED } },
  { ...data, updateAt: Date.now() },
  { new: true }
).populate('institution', '-password')
  .populate('applicant', '-password')

const findByFilter = (filter, options = {}) => objectModel.find(filter, options)
  .populate('applicant', '-password')
  .populate('institution', '-password')

const cancelSolicitation = (userId, devolutionCode, propertyToRemove) => objectModel.updateOne(
  { devolutionCode,
    $or: [{ institution: userId }, { applicant: userId }],
    status: objectStatus.SOLICITADED
  },
  { status: objectStatus.AVAILABLE, updateAt: Date.now(), $unset: propertyToRemove }
)

module.exports = {
  register,
  find,
  findById,
  findByFilter,
  addSolicitation,
  devolve,
  update,
  cancelSolicitation
}

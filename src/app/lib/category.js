const categoryRepository = require('../repositories/category')
const { validationError } = require('./error-wrap')

/**
 * Get all categories
 * @return {array<object>} Categories
 */
const get = () => categoryRepository.find()

/**
 * Check if category exists
 * @param  {string} name - Category's name
 */
const checkCategoryExists = async name => {
  const registered = await categoryRepository.findOne({ name })
  if (registered) throw validationError(`Categoria ${name} é similar a ${registered.name} já cadastrada.`)
}

/**
 * Register a new category
 * @param  {object} category - Category's data
 * @return {boolean}
 */
const register = async category => {
  await checkCategoryExists(category.name)
  await categoryRepository.register(category)
  return true
}

/**
 * Add fields or types into category
 * @param {string} categoryId - Category's id
 * @param {string} propName - Property name (fields or type)
 * @param {array} propValue - Property value
 */
const addFieldOrType = async (categoryId, propName, propValue) => {
  const result = await categoryRepository.update({
    categoryId,
    propName,
    propValue
  })

  if (result.nModified === 0) throw validationError('Ocorreu um erro ao editar dados.')
}

/**
 * Update search field
 * @param  {object} field - Category's field and id
 * @return {(object|undefined)}
 */
const updateField = async field => {
  const result = await categoryRepository.updateField(field)
  if (result.n === 0) return field.field
}

/**
 * Update category' data
 * @param  {object} category - Category
 * @return {boolean}
 */
const update = async category => {
  try {
    const { _id: categoryId, type, fields } = category

    if (type && type.length) await addFieldOrType(categoryId, 'type', type)

    if (fields && fields.length) {
      const promises = await Promise.all(fields.map(
        field => updateField({ categoryId, field })
      ))
      const fieldsToAdd = [].concat(...promises).filter(field => field)

      if (fieldsToAdd.length) await addFieldOrType(categoryId, 'fields', fieldsToAdd)
    }

    return true
  } catch (error) {
    if (error.name === 'CastError') throw validationError('Id da categoria inválido.')
    throw error
  }
}

module.exports = {
  get,
  register,
  update
}

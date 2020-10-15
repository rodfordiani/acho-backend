const lib = require('../lib/category')
const paramsValidator = require('../../middleware/validator')
const { forbiddenError } = require('../lib/error-wrap')
const { categorySchema, updateSchema } = require('../../schemas/category')

/**
 * Get all categories
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {array<object>} Categories
 */
const get = async (req, res, next) => {
  try {
    const categories = await lib.get()

    res.status(200).json(categories)
  } catch (error) {
    next(error)
  }
}

/**
 * Register a new category
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {string} Message
 */
const register = async (req, res, next) => {
  try {
    if (req.user.profile !== 'institution') return next(forbiddenError())

    await paramsValidator(categorySchema, req.body)
    await lib.register({ institution: req.user._id, ...req.body })

    res.status(200).json('Cadastrada com sucesso.')
  } catch (error) {
    next(error)
  }
}

/**
 * Update category' data
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {object} Category
 */
const update = async (req, res, next) => {
  try {
    if (req.user.profile !== 'institution') return next(forbiddenError())

    await paramsValidator(updateSchema, req.body)
    await lib.update(req.body)

    res.status(200).json('Editado com sucesso.')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  get,
  register,
  update
}

const lib = require('../lib/object')
const { objectSchema, solicitSchema, devolutionCodeSchema, updateSchema } = require('../../schemas/object')
const paramsValidator = require('../../middleware/validator')
const { forbiddenError } = require('../lib/error-wrap')
const { emailSubject } = require('../../config/enum.json')
const sendEmail = require('../lib/email')

/**
 * Register a new object
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {string} Message
 */
const register = async (req, res, next) => {
  try {
    if (req.user.profile !== 'institution') return next(forbiddenError())

    await paramsValidator(objectSchema, req.body)
    const object = req.body
    object.institution = req.user._id
    await lib.register(object)

    res.status(200).json('Cadastrado com sucesso.')
  } catch (error) {
    next(error)
  }
}

/**
 * Search an object with base on a filter
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {object} Object
 */
const search = async (req, res, next) => {
  try {
    await paramsValidator(objectSchema, req.body)
    const objects = await lib.search(req.body)
    res.status(200).json(objects)
  } catch (error) {
    next(error)
  }
}

/**
 * Solicit recovery an object
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {string} Devolution code
 */
const solicit = async (req, res, next) => {
  try {
    if (req.user.profile !== 'applicant') return next(forbiddenError())

    await paramsValidator(solicitSchema, req.body)

    const devolutionCode = await lib.solicit(req.user, req.body.objectId)

    sendEmail(emailSubject.SOLICIT_OBJECT, { name: req.user.name, devolutionCode })

    res.status(200).json(devolutionCode)
  } catch (error) {
    next(error)
  }
}

/**
 * Devolve an object
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {string} Message
 */
const devolve = async (req, res, next) => {
  try {
    if (req.user.profile !== 'institution') return next(forbiddenError())

    await paramsValidator(devolutionCodeSchema, req.body)
    await lib.devolve(req.user._id, req.body.devolutionCode)

    res.status(200).json('Objeto devolvido.')
  } catch (error) {
    next(error)
  }
}

/**
 * Update object' data
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {object} Object
 */
const update = async (req, res, next) => {
  try {
    if (req.user.profile !== 'institution') return next(forbiddenError())

    await paramsValidator(updateSchema, req.body)

    const result = await lib.update(req.user._id, req.body)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Get user's objects. Allow filter the object by status and/or devolution code
 * @param  {object} req - Express context
 * @param  {object} req.user - User's info receive by auth middleware
 * @param  {string} [req.query.devolutionCode] - Object's devolution code
 * @param  {string} [req.query.status] - Object's status
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {array<object>} Object
 */
const getObject = async (req, res, next) => {
  try {
    const object = await lib.getObject(req.user, req.query)

    res.status(200).json(object)
  } catch (error) {
    next(error)
  }
}

/**
 * Update object' data
 * @param  {object} req - Express context
 * @param  {object} res - Express context
 * @param  {object} next - Express context
 * @return {object} Object
 */
const cancelSolicitation = async (req, res, next) => {
  try {
    await paramsValidator(devolutionCodeSchema, req.body)
    await lib.cancelSolicitation(req.user._id, req.body.devolutionCode)

    res.status(200).json('Solicitação do objeto cancelada.')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  search,
  solicit,
  devolve,
  update,
  getObject,
  cancelSolicitation
}

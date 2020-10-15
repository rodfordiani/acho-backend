const objectRepository = require('../repositories/object')
const { validationError } = require('./error-wrap')
const { objectStatus } = require('../../config/enum')

/**
 * Register a new object
 * @param  {object} object - Object's data
 * @return {object} Object
 */
const register = object => objectRepository.register(object)

/**
 * Search an object with base on a filter
 * @param  {object} filter - Filter
 * @return {array<object>} Object
 */
const search = async filter => {
  const text = filter.fields.reduce((acc, { value }) => `${acc} ${value}`, '')
  const objects = await objectRepository.find({ ...filter, text })

  if (objects.length && objects[0].score >= objects[0].fields.length - 1) {
    const betterScore = ~~objects[0].score
    return objects.filter(obj => obj.score >= betterScore)
  }

  return []
}

/**
 * Generate a 5 caracter code
 * @param  {string} value - Base to generate the code
 * @return {string} Code
 */
const generateCode = value => {
  const base = value.split('')
  const code = []

  while (code.length < 5) {
    const position = Math.floor(Math.random() * base.length)
    code.push(base[position])
  }

  return code.join('')
}

/**
 * Verify if solicit date is inside the expiry period
 * @param  {date} date - Date to add expiry period
 * @param  {integer} days - Expiry period
 * @return {boolean}
 */
const isSolicitedDateExpired = (date, days) => {
  const expiryDate = new Date(date)
  const dateNow = new Date()

  expiryDate.setDate(expiryDate.getDate() + days)
  expiryDate.setHours(0, 0, 0, 0)
  dateNow.setHours(0, 0, 0, 0)

  return dateNow > expiryDate
}

/**
 * Solicit recovery an object
 * @param  {object} user - User's data
 * @param  {string} objectId - Object's id
 * @return {string} Devolution code
 */
const solicit = async (user, objectId) => {
  try {
    const { solicitedAt, status, applicant } = await objectRepository.findById(objectId)

    if (applicant && applicant.toString() === user._id.toString()) {
      throw validationError('Objeto só pode ser solicitado uma vez.')
    }

    if (status === objectStatus.DEVOLVED) {
      throw validationError('Não é possível solicitar objeto que já foi devolvido.')
    }

    if (solicitedAt && !isSolicitedDateExpired(solicitedAt, 3)) {
      throw validationError('Não é possível reivindicar o objeto, pois o período de solicitação não expirou.')
    }

    const devolutionCode = generateCode(objectId)
    const data = {
      devolutionCode,
      applicant: user._id,
      solicitedAt: Date.now()
    }
    const { nModified } = await objectRepository.addSolicitation(objectId, data)

    if (!nModified) throw validationError('Erro ao solicitar objeto. Verifique as informações do objeto.')

    return devolutionCode
  } catch (error) {
    if (error.name === 'CastError') throw validationError('Objeto não econtrado.')
    throw error
  }
}

/**
 * Devolve an object according to institution and devolution code
 * @param  {string} institutionId - Institution's id
 * @param  {string} devolutionCode - Devolution code
 * @return {boolean}
 */
const devolve = async (institutionId, devolutionCode) => {
  const filter = {
    devolutionCode,
    institution: institutionId
  }

  const [object] = await findByFilter(filter)
  if (!object) throw validationError('Objeto não econtrado.')

  const { nModified } = await objectRepository.devolve(object._id)

  if (!nModified) {
    throw validationError('Ocorreu um erro ao efetuar devolução. Verfique se o objeto já foi devolvido.')
  }

  return true
}

/**
 * Update object' data
 * @param  {string} institutionId - Institution's id
 * @param  {object} object - Object
 * @return {object} Object
 */
const update = async (institutionId, object) => {
  try {
    const result = await objectRepository.update(institutionId, object)
    if (!result) throw validationError('Ocorreu um erro ao editar dados.')
    return result
  } catch (error) {
    if (error.name === 'CastError') throw validationError('Objeto não econtrado.')
    throw error
  }
}

/**
 * Find object(s) according to filter and options
 * @param  {object} filter - Info(s) to find in object
 * @param  {object} [options={}] - Additional search restriction
 * @return {Promise}
 */
const findByFilter = (filter, options = {}) => objectRepository.findByFilter(filter, options)

/**
 * Get object(s) according to query fields
 * @param  {object} user - User's data
 * @param  {object} queryFields - Query params
 * @return {Promise}
 */
const getObject = (user, queryFields) => {
  const { _id: id, profile } = user
  const { devolutionCode, status } = queryFields
  const filter = { [profile]: id }

  if (devolutionCode) filter.devolutionCode = devolutionCode
  if (status) filter.status = status

  return findByFilter(filter, { [profile]: 0 })
}

/**
 * Cancel solicitation of object
 * @param  {string} userId - User's id
 * @param  {string} devolutionCode - Devolution code
 * @return {boolean}
 */
const cancelSolicitation = async (userId, devolutionCode) => {
  const propertyToRemove = {
    applicant: '',
    devolutionCode: '',
    solicitedAt: ''
  }
  const { nModified } = await objectRepository
    .cancelSolicitation(userId, devolutionCode, propertyToRemove)

  if (!nModified) {
    throw validationError('Ocorreu um erro ao cancelar solicitação do objeto. Verique o código de devolução.')
  }
  return true
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

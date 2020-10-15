const mongoose = require('../../config/bd-connect')

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: {
    street: { type: String, required: true },
    number: { type: String, required: true },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'userCollection', discriminatorKey: 'profile' })

const userModel = mongoose.model('userCollection', schema)

const institutionModel = userModel.discriminator('institution',
  new mongoose.Schema({
    cnpj: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    fantasyName: { type: String, required: true }
  })
)

const applicantModel = userModel.discriminator('applicant',
  new mongoose.Schema({
    cpf: { type: String, required: true, unique: true },
    name: { type: String, required: true }
  })
)

module.exports = {
  userModel,
  applicantModel,
  institutionModel
}

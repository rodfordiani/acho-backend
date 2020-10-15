const lib = require('../../src/app/lib/object')
const objectRepository = require('../../src/app/repositories/object')
const mockObject = require('../mock/object')

describe('Lib/object - #register', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('register a new object', async () => {
    const object = {
      name: 'mock',
      category: 'mockCategory',
      type: 'mockType',
      foundDate: '2019/05/06',
      fields: [{
        type: 'test',
        value: 'mocked value'
      }],
      institution: 'mockInstitution'
    }

    jest.spyOn(objectRepository, 'register').mockResolvedValue(object)
    expect(await lib.register(object)).toEqual(object)
  })
})

describe('Lib/object - #solicit', () => {
  const applicant = { _id: 'applicantMockId' }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('register a solicitation of devolution of object', async () => {
    const [, objectStatusZero] = mockObject

    jest.spyOn(objectRepository, 'findById').mockResolvedValue(objectStatusZero)
    jest.spyOn(objectRepository, 'addSolicitation').mockResolvedValue({ nModified: 1 })

    expect(await lib.solicit(applicant, objectStatusZero._id)).toHaveLength(5)
  })

  describe('when object was already solicited', () => {
    it('returns an error', async () => {
      const [, , objectStatusOne] = mockObject
      const errorExpected = {
        message: 'Objeto só pode ser solicitado uma vez.',
        name: 'Bad Request',
        statusCode: 400
      }

      jest.spyOn(objectRepository, 'findById').mockResolvedValue({ ...objectStatusOne, applicant: applicant._id })

      await expect(lib.solicit(applicant, objectStatusOne._id)).rejects.toEqual(errorExpected)
    })
  })

  describe('when object was devolved', () => {
    it('returns an error', async () => {
      const [objectStatusTwo] = mockObject

      const errorExpected = {
        message: 'Não é possível solicitar objeto que já foi devolvido.',
        name: 'Bad Request',
        statusCode: 400
      }

      jest.spyOn(objectRepository, 'findById').mockResolvedValue({ ...objectStatusTwo, applicant: 'otherApplicantId' })

      await expect(lib.solicit(applicant, 'mockObject')).rejects.toEqual(errorExpected)
    })
  })

  describe('when solicited date is not expired', () => {
    it('returns an error', async () => {
      const [, , objectStatusOne] = mockObject

      const resultFindById = {
        ...objectStatusOne,
        applicant: 'otherApplicantId',
        solicitedAt: new Date()
      }
      const errorExpected = {
        message: 'Não é possível reivindicar o objeto, pois o período de solicitação não expirou.',
        name: 'Bad Request',
        statusCode: 400
      }

      jest.spyOn(objectRepository, 'findById').mockResolvedValue(resultFindById)

      await expect(lib.solicit(applicant, 'mockObject')).rejects.toEqual(errorExpected)
    })
  })

  describe('when object id is invalid', () => {
    it('returns an error', async () => {
      jest.spyOn(objectRepository, 'findById').mockRejectedValue({ name: 'CastError' })
      const errorExpected = {
        message: 'Objeto não econtrado.',
        name: 'Bad Request',
        statusCode: 400
      }

      await expect(lib.solicit(applicant, 'invalidObjectId')).rejects.toEqual(errorExpected)
    })
  })

  it('returns an error', async () => {
    const [, objectStatusZero] = mockObject

    jest.spyOn(objectRepository, 'findById').mockResolvedValue(objectStatusZero)
    jest.spyOn(objectRepository, 'addSolicitation').mockResolvedValue({ nModified: 0 })

    const errorExpected = {
      message: 'Erro ao solicitar objeto. Verifique as informações do objeto.',
      name: 'Bad Request',
      statusCode: 400
    }

    await expect(lib.solicit(applicant, 'ObjectId')).rejects.toEqual(errorExpected)
  })
})

describe('Lib/object - #devolve', () => {
  const [, , objectStatusOne] = mockObject

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('devolve an object', async () => {
    jest.spyOn(objectRepository, 'findByFilter').mockResolvedValue([objectStatusOne])
    jest.spyOn(objectRepository, 'devolve').mockResolvedValue({ nModified: 1 })

    expect(await lib.devolve('mockInstitutionId', objectStatusOne.devolutionCode)).toBeTruthy()
  })

  describe('when object is not found', () => {
    it('returns an error', async () => {
      jest.spyOn(objectRepository, 'findByFilter').mockResolvedValue([])
      const errorExpected = {
        message: 'Objeto não econtrado.',
        name: 'Bad Request',
        statusCode: 400
      }

      await expect(lib.devolve('mockInstitutionId', 'invalidCode')).rejects.toEqual(errorExpected)
    })
  })

  it('returns an error', async () => {
    const errorExpected = {
      message: 'Ocorreu um erro ao efetuar devolução. Verfique se o objeto já foi devolvido.',
      name: 'Bad Request',
      statusCode: 400
    }

    jest.spyOn(objectRepository, 'findByFilter').mockResolvedValue([objectStatusOne])
    jest.spyOn(objectRepository, 'devolve').mockResolvedValue({ nModified: 0 })

    await expect(lib.devolve('mockInstitutionId', objectStatusOne.devolutionCode))
      .rejects.toEqual(errorExpected)
  })
})

describe('Lib/object - #update', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('update object', async () => {
    const [, objectStatusZero] = mockObject
    const institutionId = objectStatusZero.institution

    const objectUpdate = { _id: objectStatusZero._id, name: 'change' }
    const objectExpected = { ...objectStatusZero, ...objectUpdate }

    jest.spyOn(objectRepository, 'update').mockResolvedValue(objectExpected)
    expect(await lib.update(institutionId, objectUpdate)).toEqual(objectExpected)
  })

  it('returns an error', async () => {
    jest.spyOn(objectRepository, 'update').mockResolvedValue()
    const errorExpected = {
      message: 'Ocorreu um erro ao editar dados.',
      name: 'Bad Request',
      statusCode: 400
    }

    await expect(lib.update('mockId', { _id: 'mock', name: 'change' })).rejects.toEqual(errorExpected)
  })

  describe('when object id is invalid', () => {
    it('returns an error', async () => {
      jest.spyOn(objectRepository, 'update').mockRejectedValue({ name: 'CastError' })
      const errorExpected = {
        message: 'Objeto não econtrado.',
        name: 'Bad Request',
        statusCode: 400
      }

      await expect(lib.update('mockId', { _id: 'invalid' })).rejects.toEqual(errorExpected)
    })
  })
})

describe('Lib/object - #getObject', () => {
  const user = {
    _id: 'mockId',
    profile: 'institution'
  }
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('return object filter by user id', async () => {
    jest.spyOn(objectRepository, 'findByFilter').mockResolvedValue(mockObject)

    expect(await lib.getObject(user, {})).toEqual(mockObject)
  })

  it('return object filter by user id and status', async () => {
    const [objectStatusTwo] = mockObject
    const query = { status: 2 }
    jest.spyOn(objectRepository, 'findByFilter').mockResolvedValue([objectStatusTwo])

    expect(await lib.getObject(user, query)).toEqual([objectStatusTwo])
  })

  it('return object filter by user id and devolution code', async () => {
    const [objectStatusTwo] = mockObject
    const query = { devolutionCode: 'code1' }
    jest.spyOn(objectRepository, 'findByFilter').mockResolvedValue([objectStatusTwo])

    expect(await lib.getObject(user, query)).toEqual([objectStatusTwo])
  })
})

describe('Lib/object - #search', () => {
  const filter = {
    category: 'mockDoc',
    type: 'mockType',
    foundDate: '2019/05/06',
    fields: [{
      name: 'test',
      value: 'mocked value'
    }]
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when have no found object', () => {
    it('returns an empty list', async () => {
      jest.spyOn(objectRepository, 'find').mockResolvedValue([])

      await expect(lib.search(filter)).resolves.toEqual([])
    })
  })

  it('returns an object', async () => {
    const [, objectStatusZero] = mockObject

    const objectResponse = [{ ...objectStatusZero, score: 2 }]
    jest.spyOn(objectRepository, 'find').mockResolvedValue(objectResponse)

    await expect(lib.search(filter)).resolves.toEqual(objectResponse)
  })
})

describe('Lib/object - #cancelSolicitation', () => {
  const userId = 'mockUserId'
  const devolutionCode = 'code1'

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('cancel solicitation', async () => {
    jest.spyOn(objectRepository, 'cancelSolicitation').mockResolvedValue({ nModified: 1 })
    expect(await lib.cancelSolicitation(userId, devolutionCode)).toBeTruthy()
  })

  it('returns an error', async () => {
    jest.spyOn(objectRepository, 'cancelSolicitation').mockResolvedValue({ nModified: 0 })
    const errorExpected = {
      message: 'Ocorreu um erro ao cancelar solicitação do objeto. Verique o código de devolução.',
      name: 'Bad Request',
      statusCode: 400
    }

    await expect(lib.cancelSolicitation(userId, devolutionCode)).rejects.toEqual(errorExpected)
  })
})

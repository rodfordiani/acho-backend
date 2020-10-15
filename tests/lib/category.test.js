
const lib = require('../../src/app/lib/category')
const categoryRepository = require('../../src/app/repositories/category')

const category = {
  name: 'mockCategory',
  type: ['mockType'],
  fields: [{
    name: 'test',
    options: ['mockedOption']
  }]
}

describe('Lib/category - #get', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns categories', async () => {
    jest.spyOn(categoryRepository, 'find').mockResolvedValue([])
    expect(await lib.get()).toHaveLength(0)
  })
})

describe('Lib/category - #register', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('register a new category', async () => {
    jest.spyOn(categoryRepository, 'findOne').mockResolvedValue()
    jest.spyOn(categoryRepository, 'register').mockResolvedValue(category)
    expect(await lib.register(category)).toBeTruthy()
  })

  describe('when category is registered', () => {
    it('returns an error', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(category)
      const errorExpected = {
        message: `Categoria ${category.name} é similar a ${category.name} já cadastrada.`,
        name: 'Bad Request',
        statusCode: 400
      }
      await expect(lib.register(category)).rejects.toEqual(errorExpected)
    })
  })
})

describe('Lib/category - #update', () => {
  const categoryUpdate = {
    _id: 'mock',
    type: ['changeType'],
    fields: [{
      name: 'test',
      options: ['changeOption']
    }]
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('update category', async () => {
    jest.spyOn(categoryRepository, 'update').mockResolvedValue({ nModified: 1 })
    jest.spyOn(categoryRepository, 'updateField').mockResolvedValue({ n: 1 })

    expect(await lib.update(categoryUpdate)).toBeTruthy()
  })

  describe('when fields field is not passed', () => {
    it('add new type', async () => {
      const { fields, ...newCategory } = categoryUpdate
      jest.spyOn(categoryRepository, 'update').mockResolvedValue({ nModified: 1 })

      expect(await lib.update(newCategory)).toBeTruthy()
    })
  })

  describe('when type field is not passed', () => {
    it('update fields', async () => {
      const { type, ...newCategory } = categoryUpdate
      jest.spyOn(categoryRepository, 'updateField').mockResolvedValue({ n: 1 })

      expect(await lib.update(newCategory)).toBeTruthy()
    })
  })

  describe('when field does not exist', () => {
    it('add a new field', async () => {
      const { type, ...newCategory } = categoryUpdate

      jest.spyOn(categoryRepository, 'update').mockResolvedValue({ nModified: 1 })
      jest.spyOn(categoryRepository, 'updateField').mockResolvedValue({ n: 0 })

      expect(await lib.update(newCategory)).toBeTruthy()
    })
  })

  it('returns an error', async () => {
    const errorExpected = {
      message: 'Ocorreu um erro ao editar dados.',
      name: 'Bad Request',
      statusCode: 400
    }
    const { fields, ...invalidCategory } = categoryUpdate
    jest.spyOn(categoryRepository, 'update').mockResolvedValue({ nModified: 0 })

    await expect(lib.update(invalidCategory)).rejects.toEqual(errorExpected)
  })

  describe('when id is invalid', () => {
    it('returns an error', async () => {
      const errorExpected = {
        message: 'Id da categoria inválido.',
        name: 'Bad Request',
        statusCode: 400
      }
      jest.spyOn(categoryRepository, 'update').mockRejectedValue({ name: 'CastError' })

      await expect(lib.update({ _id: 'invalidMock', type: [''] })).rejects.toEqual(errorExpected)
    })
  })
})

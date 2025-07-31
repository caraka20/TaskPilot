import supertest from 'supertest'
import app from '../src/app'
import { UserTest } from './test-util'


describe('POST /api/users/register', () => {
  beforeEach(async ()=> {
    await UserTest.delete()
  })

  afterEach(async () => {
    await UserTest.delete()
  })

  it('should be able register a new user', async () => {
    const response = await supertest(app)
      .post('/api/users/register')
      .send({
        username : "raka20",
        password : "raka20",
        namaLengkap : "caraka"
      })
    
    console.log(response.body)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.data.username).toBe("raka20")
    expect(response.body.data.namaLengkap).toBe("caraka")
  })

  it('should fail to register when request body is invalid', async () => {
    const response = await supertest(app)
      .post('/api/users/register')
      .send({
        username : "",
        password : "",
        namaLengkap : ""
      })
    // console.log(response.body)
    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
  })

    it('should fail to register when username already exists', async () => {
    await UserTest.create()
    const response = await supertest(app)
      .post('/api/users/register')
      .send({
        username : "raka20",
        password : "raka20",
        namaLengkap : "caraka"
      })
    // console.log(response.body)
    expect(response.status).toBe(409)
    expect(response.body.status).toBe('error')
  })
})

describe ('POST /api/users/login', () => {
  beforeEach(async ()=> {
    await UserTest.create()
  })
  afterEach(async () => {
    await UserTest.delete()
  })

  it('shoul be able login', async () => {
    const response = await supertest(app)
      .post('/api/users/login')
      .send({
        username: "raka20",
        password : "raka20"
      })

      // console.log(response.body)
      expect(response.status).toBe(200)
      expect(response.body.data.token).toBeDefined()
  })

  it('should error when username does not exist', async () => {
    const response = await supertest(app)
      .post('/api/users/login')
      .send({
        username: "user_salah",
        password: "raka20"
      })

    // console.log(response.body)
    expect(response.status).toBe(404)
    expect(response.body.status).toBe('error')
  })

  it('should error when password is incorrect', async () => {
    const response = await supertest(app)
      .post('/api/users/login')
      .send({
        username: "raka20",
        password: "password_salah"
      })

    // console.log(response.body)
    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
  })

  it('should error when username and password is missing', async () => {
    const response = await supertest(app)
      .post('/api/users/login')
      .send({
        username : "",
        password: ""
      })

    // console.log(response.body)
    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
    expect(response.body.errors).toBeDefined()
  })
})

describe('GET /api/users', () => {

  beforeEach(async () => {
    await UserTest.create()
  })

  afterEach(async () => {
    await UserTest.delete()
  })

it('should return array of user objects with expected structure', async () => {
  const response = await supertest(app)
    .get('/api/users')

  // console.log(response.body)

  expect(response.status).toBe(200)
  expect(response.body.status).toBe('success')

  const data = response.body.data

  // pastikan data adalah array
  expect(Array.isArray(data)).toBe(true)
  expect(data.length).toBeGreaterThan(0)

  // pastikan semua elemen array adalah user object dengan struktur lengkap
  data.forEach((user: any) => {
    expect(user).toHaveProperty('username')
    expect(typeof user.username).toBe('string')

    expect(user).toHaveProperty('namaLengkap')
    expect(typeof user.namaLengkap).toBe('string')

    expect(user).toHaveProperty('role')
    expect(['USER', 'OWNER']).toContain(user.role)

    expect(user).toHaveProperty('totalJamKerja')
    expect(typeof user.totalJamKerja).toBe('number')

    expect(user).toHaveProperty('totalGaji')
    expect(typeof user.totalGaji).toBe('number')
  })
})

})

describe('GET /api/users/:username', () => {
  beforeEach(async () => {
    await UserTest.create()
  })

  afterEach(async () => {
    await UserTest.delete()
  })

  it('should get user detail by username', async () => {
    const response = await supertest(app)
      .get('/api/users/raka20')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')

    // console.log(response.body)
    const data = response.body.data
    expect(data).toHaveProperty('username', 'raka20')
    expect(data).toHaveProperty('namaLengkap', 'caraka')
    expect(data).toHaveProperty('role')
    expect(data).toHaveProperty('totalJamKerja')
    expect(data).toHaveProperty('totalGaji')
    expect(Array.isArray(data.jamKerja)).toBe(true)
    expect(Array.isArray(data.tugas)).toBe(true)
    expect(Array.isArray(data.riwayatGaji)).toBe(true)
  })

  it('should error if user not found', async () => {
    const response = await supertest(app)
      .get('/api/users/unknownuser')

    // console.log(response.body)
    expect(response.status).toBe(404)
    expect(response.body.status).toBe('error')
  })
})

describe ('DELETE /api/users/logout', () => {
  beforeEach(async () => {
    await UserTest.create()
  })

  afterEach(async () => {
    await UserTest.delete()
  })

  it("should be able logout", async () => {
    const response = await supertest(app)
      .post("/api/users/logout")
      .set('Authorization', `Bearer token`)

      console.log(response.error);
      
  } )
})
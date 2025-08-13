import supertest from 'supertest'
import app from '../src/app'
import { UserTest } from './test-util'

describe('POST /api/users/register', () => {
  let ownerToken: string

  beforeEach(async () => {
    await UserTest.delete()
    ownerToken = await UserTest.loginOwner()
  })

  afterEach(async () => {
    await UserTest.delete()
  })

  it('should be able register a new user', async () => {
    const response = await supertest(app)
      .post('/api/users/register')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        username : "raka20",
        password : "raka20",
        namaLengkap : "caraka"
      })
    
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.data.username).toBe("raka20")
    expect(response.body.data.namaLengkap).toBe("caraka")
  })

  it('should fail to register when request body is invalid', async () => {
    const response = await supertest(app)
      .post('/api/users/register')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        username : "",
        password : "",
        namaLengkap : ""
      })

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
  })

  it('should fail to register when username already exists', async () => {
    await UserTest.create()
    const response = await supertest(app)
      .post('/api/users/register')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        username : "raka20",
        password : "raka20",
        namaLengkap : "caraka"
      })

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
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()          // buat user 'raka20' (role USER)
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
  })

  afterEach(async () => {
    await UserTest.delete()
  })

  it('should return array of user objects with expected structure (OWNER)', async () => {
    const response = await supertest(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')

    const data = response.body.data
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)

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

  it('should return 403 for USER role', async () => {
    const response = await supertest(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)

    expect(response.status).toBe(403)
    expect(response.body.status).toBe('error')
  })

  it('should return 401 if no token provided', async () => {
    const response = await supertest(app).get('/api/users')

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
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
    const token = await UserTest.login()
    const response = await supertest(app)
      .get('/api/users/raka20')
      .set('Authorization', `Bearer ${token}`)

    // console.log(response.body)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')

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
    expect(response.status).toBe(401)
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
    const token = await UserTest.login()
    const response = await supertest(app)
      .post("/api/users/logout")
      .set('Authorization', `Bearer ${token}`)

      // console.log(response.body);
      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
  } )
})

describe('PATCH /api/users/:username/jeda-otomatis', () => {
  beforeEach(async () => {
    await UserTest.create()
  })

  afterEach(async () => {
    await UserTest.delete()
  })

  it('should allow OWNER to set jeda otomatis for a user (aktif: false)', async () => {
    const ownerToken = await UserTest.loginOwner()

    const response = await supertest(app)
      .patch('/api/users/raka20/jeda-otomatis')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ aktif: false })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.data.jedaOtomatis).toBe(false)
  })

  it('should allow OWNER to set jeda otomatis for a user (aktif: true)', async () => {
    const ownerToken = await UserTest.loginOwner()

    const response = await supertest(app)
      .patch('/api/users/raka20/jeda-otomatis')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ aktif: true })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.data.jedaOtomatis).toBe(true)
  })

  it('should return 400 if aktif is not a boolean', async () => {
    const ownerToken = await UserTest.loginOwner()

    const response = await supertest(app)
      .patch('/api/users/raka20/jeda-otomatis')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ aktif: 'ya' })

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
  })

  it('should return 404 if user not found', async () => {
    const ownerToken = await UserTest.loginOwner()

    const response = await supertest(app)
      .patch('/api/users/unknownuser/jeda-otomatis')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ aktif: true })

      console.log(response.body);
      
    expect(response.status).toBe(404)
    expect(response.body.status).toBe('error')
    expect(response.body.message).toBe("User not found")
  })

  it('should return 403 if role is not OWNER', async () => {
    const userToken = await UserTest.login()

    const response = await supertest(app)
      .patch('/api/users/raka20/jeda-otomatis')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ aktif: true })

    expect(response.status).toBe(403)
    expect(response.body.status).toBe('error')
  })

  it('should return 401 if no token provided', async () => {
    const response = await supertest(app)
      .patch('/api/users/raka20/jeda-otomatis')
      .send({ aktif: true })

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
  })
})
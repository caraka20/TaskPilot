import supertest from 'supertest'
import app from '../src/app'
import { prismaClient } from '../src/config/database'
import { GajiTest, UserTest } from './test-util' 

describe('POST /api/gaji', () => {
  beforeEach(async () => {
    await UserTest.create()
  })

  afterEach(async () => {
    await GajiTest.delete()
    await UserTest.delete()
  })

    it('should be able to create gaji', async () => {
        const response = await supertest(app)
        .post('/api/gaji')
        .send({
            username: 'raka20',
            jumlahBayar: 100000,
            catatan: 'shift pagi'
        })

        // console.log(response.body)
        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(response.body.data.id).toBeDefined()
    })

    it('should error to create gaji when username not found', async () => {
    const response = await supertest(app)
        .post('/api/gaji')
        .send({
        username: 'tidakadauser',
        jumlahBayar: 50000,
        catatan: 'tidak valid'
        })

    // console.log(response.body)
    expect(response.status).toBe(404)
    expect(response.body.status).toBe('error')
    expect(response.body.message).toBe('User not found')
    })

    it('should error to create gaji when username is invalid', async () => {
    const response = await supertest(app)
        .post('/api/gaji')
        .send({
        username: '',
        jumlahBayar: 50000,
        catatan: 'kosong username'
        })

    // console.log(response.body)
    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
    expect(response.body.message).toBe('Validation failed')
    })

})

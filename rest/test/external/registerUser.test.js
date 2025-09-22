const request = require('supertest')
const { expect } = require('chai')

require('dotenv').config()

describe('Registrar usuário', () => {
    
    it('POST /api/users/register - Validar que é possível registrar um usuário', async () => {
        const registerUser = require('../fixture/requests/register/registerUser.json')

        const resposta = await request(process.env.BASE_URL_REST)
            .post('/api/users/register')
            .send(registerUser)

        expect(resposta.status).to.equal(201)
    })

    it('POST /api/users/register - Validar que não é possível registrar um usuário com um e-mail que já existe', async () => {
        const registerInvalid = require('../fixture/requests/register/registerInvalid.json')

        const resposta = await request(process.env.BASE_URL_REST)
            .post('/api/users/register')
            .send(registerInvalid)

        expect(resposta.status).to.equal(400)
        expect(resposta.body.error).to.equal('Email já cadastrado')
    })
    
})
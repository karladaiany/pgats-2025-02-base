const request = require('supertest')
const { expect } = require('chai')

require('dotenv').config()

describe('Teste de registro de usuário', () => {
    
    it('Validar que é possível registrar um usuário', async () => {
        const registerUser = require('../fixture/requests/register/registerUser.json')
        const respostaEsperada = require('../fixture/responses/register/validarQueEPossivelRegistrarUmUsuario.json')

        const resposta = await request(process.env.BASE_URL_GRAPHQL)
            .post('/graphql')
            .send(registerUser)

        expect(resposta.status).to.equal(200)
        expect(resposta.body).to.deep.equal(respostaEsperada)
    })

    it('Validar que não é possível registrar um usuário com um e-mail que já existe', async () => {
        const registerInvalid = require('../fixture/requests/register/registerInvalid.json')

        const resposta = await request(process.env.BASE_URL_GRAPHQL)
            .post('/graphql')
            .send(registerInvalid)

        expect(resposta.status).to.equal(200)
        expect(resposta.body.errors[0].message).to.equal('Email já cadastrado')
    })
    
})
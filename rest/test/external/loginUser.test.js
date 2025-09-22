const request = require('supertest')
const { expect } = require('chai')

require('dotenv').config()

describe('Login do usuário', () => {
    
    it('POST /api/users/login - Validar que login é realizado com sucesso', async () => {
        const loginUser = require('../fixture/requests/login/loginUser.json')
        
        const resposta = await request(process.env.BASE_URL_REST)
            .post('/api/users/login')
            .send(loginUser)
        
        token = resposta.body.token

        expect(resposta.status).to.equal(200)
        expect(resposta.body).to.have.property('token')
    })
    
})

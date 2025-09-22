const request = require('supertest')
const { expect } = require('chai')

require('dotenv').config()

describe('Teste de login de usuário', () => {
  
    it('Validar que login é realizado com sucesso', async () => {
        const loginUser = require('../fixture/requests/login/loginUser.json')
        
        const resposta = await request(process.env.BASE_URL_GRAPHQL)
            .post('/graphql')
            .send(loginUser)
        
        token = resposta.body.data.login.token

        expect(resposta.status).to.equal(200)
        expect(resposta.body.data.login).to.have.property('token')
    })
    
})

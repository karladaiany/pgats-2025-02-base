const request = require('supertest')
const { expect } = require('chai')

require('dotenv').config()

describe('Teste de checkout com boleto', () => {
    
    before(async () => {
        const loginUser = require('../fixture/requests/login/loginUser.json')
        const resposta = await request(process.env.BASE_URL_GRAPHQL)
            .post('/graphql')
            .send(loginUser)
        token = resposta.body.data.login.token
    })
    
    it('Validar que checkout é realizado com sucesso', async () => {
        const respostaEsperada = require('../fixture/responses/checkout/validarQueCheckoutERealizadoComSucesso.json')
        const checkoutBoleto = require('../fixture/requests/checkout/checkoutBoleto.json')
        
        const resposta = await request(process.env.BASE_URL_GRAPHQL)
            .post('/graphql')
            .set('Authorization', `Bearer ${token}`)
            .send(checkoutBoleto)
        
        expect(resposta.status).to.equal(200)
        expect(resposta.body.data).to.deep.equal(respostaEsperada.data)
    })
    
})
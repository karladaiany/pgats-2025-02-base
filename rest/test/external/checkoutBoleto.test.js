const request = require('supertest')
const { expect } = require('chai')

require('dotenv').config()

describe.only('Realizar checkout', () => {
    
    before(async () => {
        const loginUser = require('../fixture/requests/login/loginUser.json')
        const resposta = await request(process.env.BASE_URL_REST)
            .post('/api/users/login')
            .send(loginUser)
        token = resposta.body.token
    })
    
    it('POST /api/checkout - Validar que checkout é realizado com sucesso', async () => {
        const checkoutBoleto = require('../fixture/requests/checkout/checkoutBoleto.json')
        
        const resposta = await request(process.env.BASE_URL_REST)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send(checkoutBoleto)
        
        expect(resposta.status).to.equal(200)
    })
    
})
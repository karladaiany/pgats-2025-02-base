const request = require('supertest')
const sinon =  require('sinon')
const {expect} = require('chai')

const app = require('../../app.js')
const {equal} = require('assert')

const checkoutService = require('../../../src/services/checkoutService.js')

describe('Checkout Controller', () => {
    describe('POST /api/checkout', () => {
        let token

        beforeEach( async () => {
            const loginUser = require('../fixture/requests/login/loginUser.json')
            const resposta = await request(app)
                .post('/api/users/login')
                .send(loginUser)
            token = resposta.body.token
        })

        it('Validar que checkout é realizado com sucesso', async () => {
            const checkoutBoleto = require('../fixture/requests/checkout/checkoutBoleto.json')

            const checkoutMock = sinon.stub(checkoutService, 'checkout')
            checkoutMock.returns({
                userId: 2,
                items: [
                    {
                        "productId": 1,
                        "quantity": 2
                    },
                    {
                        "productId": 2,
                        "quantity": 1
                    }
                ],
                freight: 10,
                paymentMethod: "boleto",
                total: 410
            })
            
            const resposta = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(checkoutBoleto)
            
            expect(resposta.status).to.equal(200)
        })

        it('Validar que checkout com produto não cadastrado retorna 400', async () => {
            const calculateTotalMock = sinon.stub(checkoutService, 'calculateTotal')
            calculateTotalMock.throws(new Error('Produto não encontrado'))

            const resposta = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    items: [
                        {
                            "productId": 13,
                            "quantity": 2
                        }
                    ],
                    freight: 0,
                    paymentMethod: "boleto",
                })
                    expect(resposta.status).to.equal(400)
                    expect(resposta.body).to.have.property('error', 'Produto não encontrado')
        })

        afterEach(() => {
            sinon.restore()
        })
    })
})
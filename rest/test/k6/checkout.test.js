import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Trend } from 'k6/metrics'
import { BASE_URL } from './helpers/baseURL.js'
import { generateEmail } from './helpers/generateEmail.js'
import { login } from './helpers/login.js'
import { Faker } from 'k6/x/faker'

const checkoutDuration = new Trend('checkout_duration')
let faker = new Faker()
let token = ''

export const options = {
    stages: [
        { duration: '3s', target: 10 },
        { duration: '15s', target: 10 },
        { duration: '3s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'checkout_duration': ['p(95)<2000'],
        'checks': ['rate>0.95'],
    },
}

export default function () {
    const userData = {
        email: generateEmail(),
        name: faker.person.firstName(),
        password: faker.internet.password(),
        productId: 1,
        quantity: 1,
        freight: 20,
        paymentMethod: 'boleto'
    }

    group('Registro de usuário', () => {
        const registerUrl = `${BASE_URL}/api/users/register`

        const registerPayload = JSON.stringify({
            name: userData.name,
            email: userData.email,
            password: userData.password
        })

        const registerParams = {
            headers: {
                'Content-Type': 'application/json',
            },
        }

        const registerResponse = http.post(registerUrl, registerPayload, registerParams)
    
        check(registerResponse, {
            'Registro: status code é 201': (r) => r.status === 201,
            'Registro: retorna nome e email': (r) => 
                r.json('user') && 
                r.json('user').name === 
                userData.name && 
                r.json('user').email === 
                userData.email,
        })
    })

    sleep(1)

    group('Login de usuário', () => {
        const response = login(userData.email, userData.password).response
        token = login(userData.email, userData.password).token
        
        check(response, {
            'Login: status code é 200': (r) => r.status === 200,
            'Login: token retornado com sucesso': (r) => r.json('token') !== null && r.json('token') !== undefined,
        })
    })

    sleep(1)

    group('Checkout', () => {
        const checkoutUrl = `${BASE_URL}/api/checkout`
        
        const checkoutPayload = JSON.stringify({
            items: [
                {
                    productId: userData.productId,
                    quantity: userData.quantity
                }
            ],
            freight: userData.freight,
            paymentMethod: userData.paymentMethod,
            cardData: {
                number: "string",
                name: "string",
                expiry: "string",
                cvv: "string"
            }
        })

        const checkoutParams = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }

        const checkoutResponse = http.post(checkoutUrl, checkoutPayload, checkoutParams)
        checkoutDuration.add(checkoutResponse.timings.duration)

        check(checkoutResponse, {
            'Checkout: status code é 200': (r) => r.status === 200,
            'Checkout: retorna valorFinal': (r) => r.json('valorFinal') !== undefined,
            'Checkout: retorna paymentMethod': (r) => r.json('paymentMethod') === userData.paymentMethod,
        })
    })

    sleep(1)
}

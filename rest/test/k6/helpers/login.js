import http from 'k6/http'
import { BASE_URL } from './baseURL.js'

export function login(email, password) {
    const url = `${BASE_URL}/api/users/login`
    
    const payload = JSON.stringify({
        email,
        password,
    })

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    }

    const response = http.post(url, payload, params)

    let token = ''
    
    if (response.status === 200) {
        const body = JSON.parse(response.body)
        token = body.token
    }

    return { response, token }
}

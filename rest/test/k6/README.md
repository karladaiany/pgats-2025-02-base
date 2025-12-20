# Teste de Performance K6 - API REST Checkout

## Visão Geral
Este diretório contém o teste de performance automatizado com K6 para o fluxo de checkout da API REST, implementando diversos conceitos de testes de performance.

## Conceitos Implementados

### 1. **Thresholds**
**Arquivo:** `rest/test/k6/checkout.test.js` (linhas 13-24)

**Código implementado:**

```javascript
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
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, foram configuramos três thresholds dentro do objeto `options`: 
- `http_req_duration: p(95)<2000` para considerar que 95% das requisições HTTP devem responder em até 2 segundos.
- `checkout_duration: p(95)<2000` para analisar, especificamente, as requisições de checkout.
- `checks` com `rate>0.95` definindo que 95% das validações devem passar.

---

### 2. **Checks**
**Arquivo:** `rest/test/k6/checkout.test.js` (múltiplas ocorrências)

**Código implementado - Exemplo 1 (Registro):**

```javascript
check(registerResponse, {
    'Registro: status code é 201': (r) => r.status === 201,
    'Registro: retorna nome e email': (r) => 
        r.json('user') && 
        r.json('user').name === 
        userData.name && 
        r.json('user').email === 
        userData.email,
})
```

**Código implementado - Exemplo 2 (Login):**
```javascript
check(response, {
            'Login: status code é 200': (r) => r.status === 200,
            'Login: token retornado com sucesso': (r) => r.json('token') !== null && r.json('token') !== undefined,
        })
```

**Código implementado - Exemplo 3 (Checkout):**

```javascript
check(checkoutResponse, {
    'Checkout: status code é 200': (r) => r.status === 200,
    'Checkout: retorna valorFinal': (r) => r.json('valorFinal') !== undefined,
    'Checkout: retorna paymentMethod': (r) => r.json('paymentMethod') === userData.paymentMethod,
})
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, aplicado a função `check()` após cada requisição HTTP. 
- **Registro**
Validado que o status code é 201 e se o nome e email retornados correspondem aos enviados. 
- **Login**
Realizada a verificação de que o status code é 200 e que o token retorna um valor diferente de `NULL` e de `undefined`. 
- **Checkout**
Verificado que o status é 200, se o campo `valorFinal` existe na resposta e se o `paymentMethod` retornado é igual ao enviado.

---

### 3. **Helpers**
**Arquivo:** Diretório `rest/test/k6/helpers/`

**Código implementado - Helper 1 (baseURL.js):**

```javascript
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
```

**Código implementado - Helper 2 (generateEmail.js):**

```javascript
export function generateEmail() {
    const timestamp = Date.now();
    return `vu_${__VU}_${timestamp}@test.com`;
}
```

**Código implementado - Helper 3 (login.js):**

```javascript
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
```

**Uso no teste principal:**

```javascript
// Importações no topo do arquivo
import { BASE_URL } from './helpers/baseURL.js'
import { generateEmail } from './helpers/generateEmail.js'
import { login } from './helpers/login.js'

// Uso dentro do group Login
group('Login de usuário', () => {
    token = login(email, password).token
})
```

**Como foi aplicado:** 
No diretório `rest/test/k6/helpers/`, existem três arquivos com as funções de:
- `baseURL.js`
Exporta a constante BASE_URL lendo variável de ambiente
- `generateEmail.js`
Exporta a função que gera e-mails únicos
- `login.js` 
Exporta a função que encapsula toda lógica de autenticação (requisição POST, parsing da resposta, extração do token). 

No arquivo principal `checkout.test.js`, importamos esses helpers para reutilização durante os testes.

---

### 4. **Trends**
**Arquivo:** `rest/test/k6/checkout.test.js` (linhas 3, 9, 107)

**Código implementado:**

```javascript
// Importação no topo do arquivo
import { Trend } from 'k6/metrics'

// Criação da métrica customizada
const checkoutDuration = new Trend('checkout_duration')

// Dentro do group Checkout - adiciona valor à métrica
group('Checkout', () => {
    const checkoutResponse = http.post(checkoutUrl, checkoutPayload, checkoutParams)
    checkoutDuration.add(checkoutResponse.timings.duration)
})
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, importamos `Trend` do módulo `k6/metrics` e criamos a instância `checkoutDuration`. 

Dentro do group Checkout, após executar a requisição POST, chamamos `checkoutDuration.add(checkoutResponse.timings.duration)` para adicionar o tempo de resposta à métrica customizada. 

Isso permite monitorar especificamente a performance do checkout separado das outras requisições, e o threshold `checkout_duration: ['p(95)<2000']` valida essa métrica.

---

### 5. **Faker**
**Arquivo:** `rest/test/k6/checkout.test.js` (linhas 7, 10, 29-30)

**Código implementado:**

```javascript
// Importação no topo do arquivo
import { Faker } from 'k6/x/faker'

// Instanciação do Faker
let faker = new Faker()

// Uso dentro da função default para gerar dados aleatórios
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
}
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, importamos a extensão `Faker` do módulo `k6/x/faker` e instanciamos com `let faker = new Faker()`. 

Dentro da função default, usamos `faker.person.firstName()` para gerar nomes aleatórios e `faker.internet.password()` para gerar senhas aleatórias, preenchendo o objeto `userData`.

---

### 6. **Variável de Ambiente**
**Arquivo:** `rest/test/k6/helpers/baseURL.js` (linha 1)

**Código implementado:**

```javascript
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
```

**Uso no teste principal:** (linhas 4, 38 e 80)

```javascript
// rest/test/k6/checkout.test.js - Importação
import { BASE_URL } from './helpers/baseURL.js'

// Uso nas requisições
const registerUrl = `${BASE_URL}/api/users/register`
const checkoutUrl = `${BASE_URL}/api/checkout`
```

**Uso no helper de login** (linhas 2 e 5)

```javascript
// rest/test/k6/helpers/login.js - Importação
import { BASE_URL } from './baseURL.js'

// Uso na requisição
const url = `${BASE_URL}/api/users/login`
```

**Como executar com variável de ambiente:**

```bash
k6 run -e BASE_URL=http://localhost:3000 rest/test/k6/checkout.test.js
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/helpers/baseURL.js`, exportamos a constante `BASE_URL` que usa `__ENV.BASE_URL` para ler a variável de ambiente, com fallback para `http://localhost:3000`. 

No arquivo principal `checkout.test.js` e no helper `login.js` importamos essa constante e a utilizamos para construir as URLs das requisições (`${BASE_URL}/api/users/register`, `${BASE_URL}/api/checkout` e `${BASE_URL}/api/users/login`). 

Para executar, se não especificarmos `BASE_URL` será aplicado o valor padrão. Caso contrário, podemos informar a variável via flag `-e`: `k6 run -e BASE_URL=http://localhost:3000 rest/test/k6/checkout.test.js`.

---

### 7. **Stages**
**Arquivo:** `rest/test/k6/checkout.test.js` (linhas 14-18)

**Código implementado:**

```javascript
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
};
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, dentro do objeto `options`, configuramos o array `stages` com três objetos:
- `{ duration: '3s', target: 10 }` 
Faz o K6 aumentar gradualmente de 0 para 10 VUs em 3 segundos (ramp-up).
- `{ duration: '15s', target: 10 }` 
Mantém 10 VUs constantes por 15 segundos (plateau).
- `{ duration: '3s', target: 0 }`
Reduz gradualmente de 10 para 0 VUs em 3 segundos (ramp-down).

---

### 8. **Reaproveitamento de Resposta**
**Arquivo:** `rest/test/k6/checkout.test.js` (linhas 67-75, 99-104)

**Código implementado:**

```javascript
// GROUP 1: Login - extrai e armazena o token
group('Login de usuário', () => {
    const response = login(userData.email, userData.password).response
    token = login(userData.email, userData.password).token
    
    check(response, {
        'Login: status code é 200': (r) => r.status === 200,
        'Login: token obtido com sucesso': (r) => r.json('token') !== null && r.json('token') !== undefined,
    })
})

// GROUP 2: Checkout - reutiliza o token obtido no login
group('Checkout', () => {
    const checkoutParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    }

    const checkoutResponse = http.post(checkoutUrl, checkoutPayload, checkoutParams)
})
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, dentro do group 'Login de usuário' executamos a função `login(userData.email, userData.password).token` que retorna um objeto com `token` e armazenamos o token extraído na variável `token` (declarada no escopo do módulo).

Em seguida, no group 'Checkout', reutilizamos essa variável `token` no header `Authorization: Bearer ${token}` da requisição de checkout.

---

### 9. **Uso de Token de Autenticação**
**Arquivo:** `rest/test/k6/checkout.test.js` e `rest/test/k6/helpers/login.js`

**Código implementado - Extração do token (login.js):**

```javascript
export function login(email, password) {
    const response = http.post(url, payload, params)

    let token = ''
    
    if (response.status === 200) {
        const body = JSON.parse(response.body)
        token = body.token
    }

    return { response, token }
}
```

**Código implementado - Uso do token (checkout.test.js):**

```javascript
group('Checkout', () => {
    const checkoutParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    }

    const checkoutResponse = http.post(checkoutUrl, checkoutPayload, checkoutParams)
})
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/helpers/login.js`, após executar a requisição POST de login, verificamos se `response.status === 200` e extraímos o token do body com `JSON.parse(response.body).token`, retornando-o junto com a response. 

Já no arquivo `rest/test/k6/checkout.test.js`, pegamos esse token e o incluímos no header da requisição de checkout usando o formato `Authorization: Bearer ${token}`, que é o padrão para autenticação JWT na API.

---

### 10. **Data-Driven Testing**
**Arquivo:** `rest/test/k6/checkout.test.js` (linhas 27-35)

**Código implementado:**

```javascript
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

    // Uso no registro
    const registerPayload = JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password
    })

    // Uso no checkout
    const checkoutPayload = JSON.stringify({
        items: [
            {
                productId: userData.productId,
                quantity: userData.quantity
            }
        ],
        freight: userData.freight,
        paymentMethod: userData.paymentMethod,
    })
}
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, dentro da função default, criamos o objeto `userData` com todas as propriedades necessárias para o fluxo completo (email, name, password, productId, quantity, freight, paymentMethod). 

Esse objeto centraliza os dados e é reutilizado em múltiplas requisições:
- **Registro**
Utilizamos `userData.name`, `userData.email` e `userData.password` para criar o payload; 
- **Checkout**
Utilizamos em `userData.productId`, `userData.quantity`, `userData.freight` e `userData.paymentMethod`.

---

### 11. **Groups**
**Arquivo:** `rest/test/k6/checkout.test.js` (múltiplas ocorrências)

**Código implementado - Exemplo 1 (Group de Registro):**

```javascript
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
```

**Código implementado - Exemplo 2 (Group de Login com Helper):**

```javascript
group('Login de usuário', () => {
    const response = login(userData.email, userData.password).response
    token = login(userData.email, userData.password).token
    
    check(response, {
        'Login: status code é 200': (r) => r.status === 200,
        'Login: token obtido com sucesso': (r) => r.json('token') !== null && r.json('token') !== undefined,
    })
})
```

**Código implementado - Exemplo 3 (Group de Checkout com Token):**

```javascript
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
```

**Como foi aplicado:** 
No arquivo `rest/test/k6/checkout.test.js`, utilizamos a função `group()` para organizar o teste em três blocos lógicos: 'Registro de usuário', 'Login de usuário' e 'Checkout'. 

Cada group encapsula todas as requisições, validações (checks) e operações relacionadas àquela etapa do fluxo. 

O K6 automaticamente agrupa as métricas por group no relatório final, permitindo analisar a performance de cada etapa separadamente e identificar gargalos específicos (por exemplo, se o checkout está mais lento que o registro).

---

## Como Executar

### 1. Iniciar o servidor da API REST

```bash
node rest/server.js
```

### 2. Executar o teste (usando BASE_URL padrão)

```bash
k6 run rest/test/k6/checkout.test.js
```

### 3. Executar o teste com variável de ambiente customizada

```bash
k6 run -e BASE_URL=http://localhost:3000 rest/test/k6/checkout.test.js
```

### 4. Executar com relatório de execução em HTML

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_PERIOD=2s K6_WEB_DASHBOARD_EXPORT=rest/test/k6/reports/html-report.html k6 run rest/test/k6/checkout.test.js
```

---

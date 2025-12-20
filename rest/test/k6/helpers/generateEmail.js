export function generateEmail() {
    const timestamp = Date.now()
    return `vu_${__VU}_${timestamp}@test.com`
}

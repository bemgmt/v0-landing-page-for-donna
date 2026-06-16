describe('Test Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true)
  })

  it('should have environment variables mocked', () => {
    expect(process.env.NEXT_PUBLIC_API_BASE).toBe('http://localhost:3000')
    expect(process.env.NEXT_PUBLIC_WEBSOCKET_URL).toBe('ws://localhost:8080')
  })

  it('should have fetch mocked', () => {
    expect(global.fetch).toBeDefined()
    expect(typeof global.fetch).toBe('function')
  })

  it('should have WebSocket mocked', () => {
    expect(global.WebSocket).toBeDefined()
    expect(typeof global.WebSocket).toBe('function')
  })
})

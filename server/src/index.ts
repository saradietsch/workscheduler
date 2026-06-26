export {}

try {
  process.loadEnvFile()
} catch {
  // no .env file present (e.g. production, where env vars are set by the platform)
}

const { app } = await import('./app.js')

const port = process.env.PORT ?? 3001

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

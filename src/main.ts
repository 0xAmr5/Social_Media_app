import bootstrap from './app.controller'

bootstrap().catch((error) => {
  console.error('Application failed to start', error)
  process.exit(1)
})

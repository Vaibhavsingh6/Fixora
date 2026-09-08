import { createApp } from './app.js';
import { env } from './config/env.js';

export const app = createApp();

// In Vercel serverless functions, the runtime invokes the exported app directly.
// Only bind to a TCP port via app.listen() when running in standard Node.js environments (local dev, docker, VM).
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Fixora Backend running at http://localhost:${env.PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
    console.log(`🩺 Health check ready at: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;

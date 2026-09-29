import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🏥 MedPulse Hospital Management System Backend Started`);
      logger.info(`🚀 Server running on port: ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`📑 API Documentation: http://localhost:${env.PORT}/api/docs`);
      logger.info(`🩺 Health Check: http://localhost:${env.PORT}/api/health`);
      logger.info(`=======================================================`);
    });

    // Graceful shutdown handlers
    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

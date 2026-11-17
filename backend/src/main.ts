import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import helmet from 'helmet';

// Enable JSON serialization for BigInt from raw database queries
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security & Cross-Origin Resource Policy for images
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Static files serving for uploaded images
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or direct requests)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        'http://localhost:5001',
        'http://127.0.0.1:5001',
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      if (allowedOrigins.includes(origin) || origin.endsWith(':5001')) {
        return callback(null, true);
      }
      return callback(null, true); // permissive for local development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Cafe POS & QR Ordering System API')
    .setDescription('API documentation for Cafe POS Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Companies', 'Company management')
    .addTag('Outlets', 'Outlet management')
    .addTag('Tables', 'Table management')
    .addTag('QR Codes', 'QR Code management')
    .addTag('Categories', 'Product categories')
    .addTag('Products', 'Product management')
    .addTag('Variants', 'Product variants')
    .addTag('Modifiers', 'Product modifiers')
    .addTag('Orders', 'Order management')
    .addTag('Payments', 'Payment processing')
    .addTag('Customers', 'Customer sessions')
    .addTag('Reports', 'Reports and analytics')
    .addTag('Audit Logs', 'Audit logging')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}
bootstrap();
import { configureHttp } from './common/configure-http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ExceptionInterceptor } from '@libs/interceptors';

const useSwagger = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle('GSR API')
    .setVersion('1.0')
    .addCookieAuth(
      'platform_refresh',
      { type: 'apiKey', in: 'cookie' },
      'refresh',
    )
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      tryItOutEnabled: true,
      operationsSorter: 'method',
      tagsSorter: 'alpha',
    },
  });
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureHttp(app);

  const configService = app.get(ConfigService);

  const env = configService.get<string>('app.env');
  const port = configService.get<number>('app.port');

  const pinoLogger = app.get(PinoLogger);
  app.useLogger(pinoLogger);

  app.useGlobalInterceptors(new ExceptionInterceptor(pinoLogger));

  useSwagger(app);
  await app.listen(port, () => {
    Logger.log(`Running on port ${port}`, 'NestApplication');
    Logger.log(`Environment: ${env}`, 'NestApplication');
  });
}
bootstrap();

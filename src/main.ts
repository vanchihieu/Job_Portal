import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransformInterceptor } from 'src/core/transform.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // global guard for all routes
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // global interceptor
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.useStaticAssets(join(__dirname, '..', 'public')); //js, css, images
  app.setBaseViewsDir(join(__dirname, '..', 'views')); //views
  app.setViewEngine('ejs');

  // validate data
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //khi update sẽ kh bị mất dữ liệu
    }),
  );

  // config cors
  app.enableCors({
    // origin: "*", // cho phep bat ki noi nao co the goi den
    origin: true, //chỉ cần (domain) cho phép kết nối từ bất cừ nơi đâu, ví dụ: localhost => localhost
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true, //cho phép client và server trao đổi
  });

  //config cookies
  app.use(cookieParser());

  //config versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    defaultVersion: ['1', '2'], //v1 v2
    type: VersioningType.URI,
  });

  await app.listen(configService.get<string>('PORT'));
}
bootstrap();

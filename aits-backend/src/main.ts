import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

interface FormattedValidationError {
  field: string;
  message: string;
}

function formatFieldName(field: string): string {
  const spaced = field
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  return spaced;
}

function getFriendlyMessage(err: ValidationError): string {
  const fieldName = formatFieldName(err.property);
  if (!err.constraints) return `Please enter a valid ${fieldName}.`;

  const keys = Object.keys(err.constraints);

  if (keys.includes('isNotEmpty') || keys.includes('isDefined')) {
    return `The ${fieldName} is required.`;
  }

  if (
    keys.includes('min') ||
    keys.includes('max') ||
    keys.includes('isNumber') ||
    keys.includes('isPositive')
  ) {
    return `Please enter a valid ${fieldName}.`;
  }

  if (keys.includes('isDate') || keys.includes('isDateString')) {
    return `Please enter a valid date for ${fieldName}.`;
  }

  if (keys.includes('isEnum') || keys.includes('isIn')) {
    return `Please select a valid option for ${fieldName}.`;
  }

  if (
    keys.includes('isString') ||
    keys.includes('maxLength') ||
    keys.includes('minLength')
  ) {
    return `Please provide a valid ${fieldName}.`;
  }

  return `Please enter a valid ${fieldName}.`;
}

function formatValidationErrors(
  errors: ValidationError[],
  parentProperty: string = '',
): FormattedValidationError[] {
  const formatted: FormattedValidationError[] = [];
  for (const err of errors) {
    const propName = parentProperty
      ? `${parentProperty}.${err.property}`
      : err.property;
    if (err.constraints) {
      formatted.push({
        field: propName,
        message: getFriendlyMessage(err),
      });
    }
    if (err.children && err.children.length > 0) {
      formatted.push(...formatValidationErrors(err.children, propName));
    }
  }
  return formatted;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://mellow-cat-production-ebe8.up.railway.app/',
    'https://mellow-cat-production-ebe8.up.railway.app',
  ];

  const configuredOrigins: string[] = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) =>
        o.trim().replace(/\/$/, ''),
      )
    : process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL.trim().replace(/\/$/, '')]
      : defaultAllowedOrigins;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (e.g. mobile apps, postman, internal calls)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        configuredOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' &&
          /^(http|exp):\/\/(localhost|127\.0\.0\.1|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(
            origin,
          ))
      ) {
        callback(null, true);
        return;
      }
      console.warn(`[CORS Diagnostic] Rejected origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });

  // Global Exception Filter for clean, structured error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatValidationErrors(errors),
        });
      },
    }),
  );

  const port = process.env.PORT ?? 5001;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal error during application startup:', err);
  process.exit(1);
});

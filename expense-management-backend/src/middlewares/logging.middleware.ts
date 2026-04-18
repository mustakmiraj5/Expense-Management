import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const duration = Date.now() - start;

      const statusColor =
        statusCode >= 500
          ? '\x1b[31m'
          : statusCode >= 400
            ? '\x1b[33m'
            : '\x1b[32m';

      this.logger.log(
        `${method} ${originalUrl} ${statusColor}${statusCode}\x1b[0m - ${duration}ms`,
      );
    });

    next();
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import errors from '../config/error.config';

interface JwtPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user?: { id: number };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(errors.unauthorized);
    }

    try {
      const secret = this.configService.get<string>('jwt.secret');

      if (!secret) {
        this.logger.error('JWT secret not configured');
        throw new UnauthorizedException(errors.unauthorized);
      }

      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException(errors.unauthorized);
      }

      request.user = { id: payload.userId };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException(errors.tokenInvalid);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

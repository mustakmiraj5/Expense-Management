import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import errors from '../config/error.config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#F97316' },
  { name: 'Transport', icon: '🚌', color: '#3B82F6' },
  { name: 'Shopping', icon: '🛍️', color: '#A855F7' },
  { name: 'Entertainment', icon: '🎬', color: '#EC4899' },
  { name: 'Health', icon: '💊', color: '#10B981' },
  { name: 'Education', icon: '📚', color: '#F59E0B' },
  { name: 'Utilities', icon: '💡', color: '#6366F1' },
  { name: 'Rent & Housing', icon: '🏠', color: '#EF4444' },
  { name: 'Other', icon: '📌', color: '#6B7280' },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(errors.emailAlreadyExists);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          userId: newUser.id,
          isDefault: true,
        })),
      });

      return newUser;
    });

    const tokens = this.generateTokens(user.id);
    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException(errors.invalidCredentials);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException(errors.invalidCredentials);
    }

    const tokens = this.generateTokens(user.id);
    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException(errors.tokenInvalid);
      }
      const { accessToken } = this.generateTokens(user.id);
      return { accessToken };
    } catch {
      throw new UnauthorizedException(errors.tokenInvalid);
    }
  }

  private generateTokens(userId: number) {
    const payload = { userId };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: (this.config.get('jwt.expiresIn') ?? '7d') as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: (this.config.get('jwt.refreshExpiresIn') ?? '30d') as any,
    });
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    };
  }
}

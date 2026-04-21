import { Injectable, OnModuleInit, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { Role } from '@repo/types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    try {
      const count = await this.userModel.countDocuments();
      if (count === 0) {
        this.logger.log('No users found in database. Seeding default ADMIN user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.userModel.create({
          name: 'Super Admin',
          email: 'admin@bmakas.com',
          password: hashedPassword,
          role: Role.ADMIN,
        });
        this.logger.log('Default ADMIN user created: admin@bmakas.com / admin123');
      }
    } catch (error) {
      this.logger.error('Failed to seed default admin user', error);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async createAgent(data: { name: string; email: string; password?: string }): Promise<UserDocument> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Bu email adresi zaten kullanılıyor.');
    }

    const passwordToHash = data.password || 'agent123';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const newUser = new this.userModel({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: Role.AGENT,
    });

    return newUser.save();
  }

  async updateRefreshToken(userId: string, hashedToken: string | null) {
    return this.userModel.findByIdAndUpdate(userId, { hashedRefreshToken: hashedToken }).exec();
  }
}

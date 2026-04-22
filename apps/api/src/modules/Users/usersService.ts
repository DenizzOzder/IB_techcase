import { Injectable, OnModuleInit, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '@/modules/Users/userSchema';
import { Transaction, TransactionDocument } from '@/modules/Transactions/Schemas/transactionSchema';
import { Commission, CommissionDocument } from '@/modules/Commissions/Schemas/commissionSchema';
import { Role, TransactionStatus, IAgentResponse, IAgentDetailResponse } from '@repo/types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
  ) {}

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

  // ─── Agent Yönetimi (Admin) ────────────────────────────────────────────────

  async findAllAgents(): Promise<IAgentResponse[]> {
    const agents = await this.userModel.find({ role: Role.AGENT }).sort({ createdAt: -1 }).exec();
    return agents.map(agent => ({
      _id: agent._id.toString(),
      name: agent.name,
      email: agent.email,
      role: agent.role,
      isActive: agent.isActive,
      createdAt: (agent as any).createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  async deactivateAgent(agentId: string): Promise<void> {
    const agent = await this.userModel.findByIdAndUpdate(agentId, { isActive: false }).exec();
    if (!agent) {
      throw new NotFoundException('Danışman bulunamadı.');
    }
  }

  async getAgentStats(agentId: string): Promise<IAgentDetailResponse> {
    const agent = await this.userModel.findById(agentId).exec();
    if (!agent) {
      throw new NotFoundException('Danışman bulunamadı.');
    }

    const objId = new Types.ObjectId(agentId);

    const [txStats, commStats] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { agentId: objId, status: { $ne: 'CANCELLED' } } },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 }, 
            volume: { $sum: '$propertyPrice' } 
          } 
        }
      ]),
      this.commissionModel.aggregate([
        { $match: { agentId: objId, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    let totalTransactions = 0, completedTransactions = 0, totalVolume = 0;
    
    for (const row of txStats) {
      totalTransactions += row.count;
      if (row._id === TransactionStatus.COMPLETED) {
        completedTransactions = row.count;
        totalVolume = row.volume;
      }
    }

    return {
      _id: agent._id.toString(),
      name: agent.name,
      email: agent.email,
      role: agent.role,
      isActive: agent.isActive,
      createdAt: (agent as any).createdAt?.toISOString() || new Date().toISOString(),
      stats: {
        totalTransactions,
        completedTransactions,
        totalVolume,
        totalCommission: commStats[0]?.total ?? 0,
      }
    };
  }
}


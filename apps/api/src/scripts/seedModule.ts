import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@/modules/Users/usersModule';
import { TransactionsModule } from '@/modules/Transactions/transactionsModule';
import { CommissionsModule } from '@/modules/Commissions/commissionsModule';
import { AuditLogsModule } from '@/modules/AuditLogs/auditLogsModule';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.register({ isGlobal: true }),
    UsersModule,
    TransactionsModule,
    CommissionsModule,
    AuditLogsModule,
  ],
})
export class SeedModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TransactionsModule } from '@/modules/Transactions/transactionsModule';
import { CommissionsModule } from '@/modules/Commissions/commissionsModule';
import { AuthModule } from '@/modules/Auth/authModule';
import { UsersModule } from '@/modules/Users/usersModule';
import { StatsModule } from '@/modules/Stats/statsModule';
import { AuditLogsModule } from '@/modules/AuditLogs/auditLogsModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: `redis://${configService.get<string>('REDIS_HOST') || 'localhost'}:${configService.get<number>('REDIS_PORT') || 6379}`,
          ttl: 300 * 1000,
        }),
      }),
      inject: [ConfigService],
    }),
    TransactionsModule,
    CommissionsModule,
    AuthModule,
    UsersModule,
    StatsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

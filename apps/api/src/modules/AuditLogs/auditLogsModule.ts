import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '@/modules/AuditLogs/Schemas/auditLogSchema';
import { AuditLogsService } from '@/modules/AuditLogs/auditLogsService';
import { AuditLogsController } from '@/modules/AuditLogs/auditLogsController';
import { User, UserSchema } from '@/modules/Users/userSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}


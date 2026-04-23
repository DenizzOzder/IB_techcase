/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Transaction } from '@/modules/Transactions/Schemas/transactionSchema';
import { User } from '@/modules/Users/userSchema';
import { Role } from '@repo/types';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const transactionModel = app.get<Model<any>>(getModelToken(Transaction.name));
  const userModel = app.get<Model<any>>(getModelToken(User.name));

  console.log('Finding admins...');
  const admins = await userModel.find({ role: Role.ADMIN });
  const adminIds = admins.map((a) => a._id);

  console.log(`Found ${admins.length} admins. Updating company listings...`);

  // Admins'in oluşturduğu ilanları company listing olarak işaretle
  const result = await transactionModel.updateMany(
    { agentId: { $in: adminIds } },
    { $set: { isCompanyListing: true } },
  );

  console.log(
    `Updated ${result.modifiedCount} transactions to be company listings.`,
  );

  // Şirket için birkaç tane örnek ilan ekle
  if (admins.length > 0) {
    const admin = admins[0];
    await transactionModel.create([
      {
        agentId: admin._id,
        isCompanyListing: true,
        propertyTitle: 'Şirket İlanı: Kadıköy Merkez 3+1',
        propertyPrice: 6000000,
        commissionRate: 2,
        status: 'AGREEMENT',
      },
      {
        agentId: admin._id,
        isCompanyListing: true,
        propertyTitle: 'Şirket İlanı: Beşiktaş Lüks Daire',
        propertyPrice: 8500000,
        commissionRate: 2,
        status: 'AGREEMENT',
      },
    ]);
    console.log('Created 2 sample company listings.');
  }

  await app.close();
}

bootstrap();

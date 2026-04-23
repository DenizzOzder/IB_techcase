import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SeedModule } from './seedModule';
import { UsersService } from '@/modules/Users/usersService';
import { TransactionsService } from '@/modules/Transactions/transactionsService';
import { Role, TransactionStatus } from '@repo/types';
import { UserDocument, User } from '@/modules/Users/userSchema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const usersService = app.get(UsersService);
  const transactionsService = app.get(TransactionsService);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  console.log('Starting DB Seeding...');

  // Create 3 Admins
  const admins: any[] = [];
  for (let i = 1; i <= 3; i++) {
    const email = `admin${i}@ib.com`;
    let user = await usersService.findByEmail(email);
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await userModel.create({ email, name: `Admin ${i}`, password: hashedPassword, role: Role.ADMIN });
    }
    admins.push(user);
  }
  console.log(`Created ${admins.length} Admins`);

  // Create 200 Agents
  const agents: any[] = [];
  for (let i = 1; i <= 200; i++) {
    const email = `agent${i}@ib.com`;
    let user = await usersService.findByEmail(email);
    if (!user) {
      user = await usersService.createAgent({ email, name: `Agent ${i}`, password: 'password123' });
    }
    agents.push(user);
    if (i % 50 === 0) console.log(`Created/Verified ${i} Agents`);
  }

  // Create 200 Transactions per Agent
  const statuses = [
    TransactionStatus.AGREEMENT,
    TransactionStatus.EARNEST_MONEY,
    TransactionStatus.TITLE_DEED,
    TransactionStatus.COMPLETED,
  ];

  console.log('Starting Transactions seeding... (Total 40,000 transactions)');
  
  let totalCreated = 0;
  const startTime = Date.now();

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const txPromises: Promise<void>[] = [];
    
    for (let j = 1; j <= 200; j++) {
      txPromises.push((async () => {
        try {
          const propertyPrice = Math.floor(Math.random() * 5000000) + 1000000;
          const tx = await transactionsService.createTransaction({
            propertyTitle: `Property ${i}-${j}`,
            propertyPrice,
            commissionRate: 2, // 2%
          }, agent._id.toString());

          // Randomly advance status
          const stepsToAdvance = Math.floor(Math.random() * 4); // 0 to 3
          let currentStatus = TransactionStatus.AGREEMENT;
          const jwtPayload = { sub: agent._id.toString(), role: Role.AGENT, email: agent.email };

          for (let s = 0; s < stepsToAdvance; s++) {
            currentStatus = statuses[s + 1];
            await transactionsService.updateTransactionStatus(
              tx._id.toString(),
              { status: currentStatus },
              jwtPayload
            );
          }

          // Randomly cancel 10% of them
          if (Math.random() < 0.1 && currentStatus !== TransactionStatus.COMPLETED) {
            await transactionsService.cancelTransaction(tx._id.toString(), jwtPayload);
          }
          
          totalCreated++;
          if (totalCreated % 1000 === 0) {
            console.log(`[Progress] Created ${totalCreated}/40000 transactions...`);
          }
        } catch (err) {
           // ignore errors if any to continue seeding
        }
      })());

      // Limit concurrency to 15 to avoid Atlas rate limits
      if (txPromises.length >= 15) {
        await Promise.all(txPromises);
        txPromises.length = 0;
      }
    }
    if (txPromises.length > 0) {
      await Promise.all(txPromises);
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`Seeding completed successfully in ${duration} seconds.`);
  await app.close();
}

bootstrap();

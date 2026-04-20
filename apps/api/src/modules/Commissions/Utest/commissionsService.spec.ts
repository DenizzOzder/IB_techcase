import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from '../commissionsService';
import { getModelToken } from '@nestjs/mongoose';
import { Commission } from '../Schemas/commissionSchema';

describe('CommissionsService', () => {
  let service: CommissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        {
          provide: getModelToken(Commission.name),
          useValue: {
            // Mock veritabanı logikleri (İzole Unit Test)
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  // Komisyon hesaplama davranışları testi buraya eklenecek
});

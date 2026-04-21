import { Controller } from '@nestjs/common';
import { CommissionsService } from '@/modules/Commissions/commissionsService';

@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}
}

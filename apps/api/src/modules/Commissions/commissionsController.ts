import { Controller } from '@nestjs/common';
import { CommissionsService } from './commissionsService';

@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}
}

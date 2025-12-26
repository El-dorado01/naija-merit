import { Test, TestingModule } from '@nestjs/testing';
import { AccessRequestService } from './access-request.service';

describe('AccessRequestService', () => {
  let service: AccessRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessRequestService],
    }).compile();

    service = module.get<AccessRequestService>(AccessRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

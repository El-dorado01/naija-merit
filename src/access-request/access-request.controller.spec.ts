import { Test, TestingModule } from '@nestjs/testing';
import { AccessRequestController } from './access-request.controller';

describe('AccessRequestController', () => {
  let controller: AccessRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessRequestController],
    }).compile();

    controller = module.get<AccessRequestController>(AccessRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

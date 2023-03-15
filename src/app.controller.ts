import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return await this.appService.getHello();
  }

  @Get('/all-assets')
  async getAllAssets() {
    return await this.appService.getAllAssets();
  }

  @Get('/init-ledger')
  async initLedge() {
    return await this.appService.initLedger();
  }
}

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return await this.appService.getHello();
  }

  /**
   * Get all assets in ledger
   */
  @Get('/all-assets')
  async getAllAssets() {
    return await this.appService.getAllAssets();
  }

  /**
   * Init ledger with sample data
   */
  @Get('/init-ledger')
  async initLedge() {
    return await this.appService.initLedger();
  }

  @Get('/read-asset-by-id')
  async readAssetById(@Query() data) {
    return await this.appService.getAssetById(data.assetId);
  }

  @Post('/create-asset')
  async createAsset(@Body() data) {
    return await this.appService.createAsset(data.assetId, data.color, data.size, data.owner, data.appraisedValue);
  }

  @Post('/transfer-asset')
  async transferAsset(@Body() data) {
    return await this.appService.transferAsset(data.assetId, data.newOwner);
  }
}

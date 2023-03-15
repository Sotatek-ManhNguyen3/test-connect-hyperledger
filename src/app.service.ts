import { Injectable } from '@nestjs/common';
import { CONTRACT_ACTIONS, fullProcess } from "./utils/gateway";

@Injectable()
export class AppService {
  async getHello(): Promise<string> {
    await this.getAllAssets();
    return 'Hello World!';
  }

  async getAllAssets() {
    return await fullProcess(CONTRACT_ACTIONS.GET_ALL_ASSETS);
  }

  async initLedger() {
    return await fullProcess(CONTRACT_ACTIONS.INIT_LEDGER);
  }

  async getAssetById(assetId: string) {
    return await fullProcess(CONTRACT_ACTIONS.READ_ASSET_BY_ID, {assetId})
  }

  async createAsset(assetId: string, color: string, size: string, owner: string, appraisedValue: string) {
    return await fullProcess(CONTRACT_ACTIONS.CREATE_ASSET, {assetId, color, size, owner, appraisedValue})
  }

  async transferAsset(assetId: string, newOwner: string) {
    return await fullProcess(CONTRACT_ACTIONS.TRANSFER_ASSET, {assetId, newOwner})
  }
}

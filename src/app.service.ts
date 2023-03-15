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
}

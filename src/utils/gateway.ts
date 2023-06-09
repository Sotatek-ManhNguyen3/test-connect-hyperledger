/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
// import { Asset } from "./asset";

// const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
// const channelName = 'mychannel';
const channelName = 'tim';
// const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const chaincodeName = 'basic';
// const chaincodeName = 'tim_basic_sc';
// const mspId = envOrDefault('MSP_ID', 'Org1MSP');
const mspId = 'Org1MSP';

// Path to crypto materials.
// const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'));
// const cryptoPath = '/home/tienmanh/Documents/code/tim/test/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com';

// Path to user private key directory.
// const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));
const keyDirectoryPath = '/home/tienmanh/Documents/code/tim/tim-hyperledger/fabric/network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore';

// Path to user certificate.
const certPath = '/home/tienmanh/Documents/code/tim/tim-hyperledger/fabric/network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem';
// const certPath = '/home/tienmanh/Documents/code/tim/test/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem';

// Path to peer tls certificate.
// const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));
const tlsCertPath = '/home/tienmanh/Documents/code/tim/tim-hyperledger/fabric/network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt';

// Gateway peer endpoint.
// const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');
const peerEndpoint = 'localhost:7051';

// Gateway peer SSL host name override.
// const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');
const peerHostAlias = 'peer0.org1.example.com';

const utf8Decoder = new TextDecoder();
// const assetId = `asset${Date.now()}`;

export const CONTRACT_ACTIONS = {
  INIT_LEDGER: 'INIT_LEDGER',
  GET_ALL_ASSETS: 'GET_ALL_ASSETS',
  CREATE_ASSET: 'CREATE_ASSET',
  TRANSFER_ASSET: 'TRANSFER_ASSET',
  READ_ASSET_BY_ID: 'READ_ASSET_BY_ID',
  UPDATE_NONE_EXISTENT_ASSET: 'UPDATE_NONE_EXISTENT_ASSET',
  DELETE_ASSET: 'DELETE_ASSET'
}

export async function fullProcess(action: string, data?: any): Promise<any> {

  await displayInputParameters();

  // The gRPC client connection should be shared by all Gateway connections to this endpoint.
  const client: any = await newGrpcConnection();

  const gateway = connect({
    client,
    identity: await newIdentity(),
    signer: await newSigner(),
    // Default timeouts for different gRPC calls
    evaluateOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    endorseOptions: () => {
      return { deadline: Date.now() + 15000 }; // 15 seconds
    },
    submitOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    commitStatusOptions: () => {
      return { deadline: Date.now() + 60000 }; // 1 minute
    },
  });

  try {
    // Get a network instance representing the channel where the smart contract is deployed.
    const network = gateway.getNetwork(channelName);

    // Get the smart contract from the network.
    const contract = network.getContract(chaincodeName);

    switch (action) {
      case CONTRACT_ACTIONS.INIT_LEDGER:
        return await initLedger(contract);
      case CONTRACT_ACTIONS.CREATE_ASSET:
        return await createAsset(contract, data.assetId, data.color, data.size, data.owner, data.appraisedValue);
      case CONTRACT_ACTIONS.GET_ALL_ASSETS:
        return await getAllAssets(contract);
      case CONTRACT_ACTIONS.READ_ASSET_BY_ID:
        return await readAssetByID(contract, data.assetId);
      case CONTRACT_ACTIONS.TRANSFER_ASSET:
        return await transferAssetAsync(contract, data.assetId, data.newOwner);
      case CONTRACT_ACTIONS.UPDATE_NONE_EXISTENT_ASSET:
        return await updateNonExistentAsset(contract);
      case CONTRACT_ACTIONS.DELETE_ASSET:
        return await deleteAssetById(contract, data.assetId);
      default:
        return await getAllAssets(contract);
    }
    // Initialize a set of asset data on the ledger using the chaincode 'InitLedger' function.
    // await initLedger(contract);

    // Return all the current assets on the ledger.
    // await getAllAssets(contract);

    // Create a new asset on the ledger.
    // await createAsset(contract);

    // Update an existing asset asynchronously.
    // await transferAssetAsync(contract);

    // Get the asset details by assetID.
    // await readAssetByID(contract);

    // Update an asset which does not exist.
    // await updateNonExistentAsset(contract)
  } finally {
    gateway.close();
    client.close();
  }
}

// main().catch(error => {
//   console.error('******** FAILED to run the application:', error);
//   process.exitCode = 1;
// });

async function newGrpcConnection(): Promise<grpc.Client> {
  const tlsRootCert = await fs.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': peerHostAlias,
  });
}

async function newIdentity(): Promise<Identity> {
  const credentials = await fs.readFile(certPath);
  return { mspId, credentials };
}

async function newSigner(): Promise<Signer> {
  const files = await fs.readdir(keyDirectoryPath);
  const keyPath = path.resolve(keyDirectoryPath, files[0]);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function initLedger(contract: Contract): Promise<string> {
  console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');

  await contract.submitTransaction('InitLedger');

  console.log('*** Transaction committed successfully');
  return 'Init data successfully';
}

/**
 * Evaluate a transaction to query ledger state.
 */
async function getAllAssets(contract: Contract): Promise<any> {
  console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');

  const resultBytes = await contract.evaluateTransaction('GetAllAssets');

  const resultJson = utf8Decoder.decode(resultBytes);
  const result = JSON.parse(resultJson);
  console.log('*** Result:', result);
  return result;
}

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createAsset(contract: Contract, assetId: string, color: string, size: string, owner: string, appraisedValue: string): Promise<string> {
  console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments');

  // await contract.submitTransaction(
  //   'CreateAsset',
  //   assetId,
  //   'yellow',
  //   '5',
  //   'Tom',
  //   '1300',
  // );

  await contract.submitTransaction(
    'CreateAsset',
    assetId,
    color,
    size,
    owner,
    appraisedValue,
  );

  console.log('*** Transaction committed successfully');
  return 'Create successfully';
}

/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
async function transferAssetAsync(contract: Contract, assetId: string, newOwner: string): Promise<string> {
  console.log('\n--> Async Submit Transaction: TransferAsset, updates existing asset owner');

  const commit = await contract.submitAsync('TransferAsset', {
    arguments: [assetId, newOwner],
  });
  const oldOwner = utf8Decoder.decode(commit.getResult());

  console.log(`*** Successfully submitted transaction to transfer ownership from ${oldOwner} to ${newOwner}`);
  console.log('*** Waiting for transaction commit');

  const status = await commit.getStatus();
  if (!status.successful) {
    throw new Error(`Transaction ${status.transactionId} failed to commit with status code ${status.code}`);
  }

  console.log('*** Transaction committed successfully');
  return 'Transfer asset successfully';
}

async function readAssetByID(contract: Contract, assetId: string): Promise<any> {
  console.log('\n--> Evaluate Transaction: ReadAsset, function returns asset attributes');

  const resultBytes = await contract.evaluateTransaction('ReadAsset', assetId);

  const resultJson = utf8Decoder.decode(resultBytes);
  const result = JSON.parse(resultJson);
  console.log('*** Result:', result);
  return result;
}

/**
 * Delete asset by assetId
 * @param contract
 * @param assetId
 */
async function deleteAssetById(contract: Contract, assetId: string): Promise<any> {
  console.log(`\n--> Submit Transaction: Delete asset with id ${assetId}`);

  try {
    await contract.submitTransaction(
      'DeleteAsset',
      assetId
    )

    return `Delete asset ${assetId} successfully`
  } catch (error) {
    console.log('*** Successfully caught the error: \n', error);
  }
}

/**
 * submitTransaction() will throw an error containing details of any error responses from the smart contract.
 */
async function updateNonExistentAsset(contract: Contract): Promise<void>{
  console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');

  try {
    await contract.submitTransaction(
      'UpdateAsset',
      'asset70',
      'blue',
      '5',
      'Tomoko',
      '300',
    );
    console.log('******** FAILED to return an error');
  } catch (error) {
    console.log('*** Successfully caught the error: \n', error);
  }
}

/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
// function envOrDefault(key: string, defaultValue: string): string {
//   return process.env[key] || defaultValue;
// }

/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters(): Promise<void> {
  console.log(`channelName:       ${channelName}`);
  console.log(`chaincodeName:     ${chaincodeName}`);
  console.log(`mspId:             ${mspId}`);
  // console.log(`cryptoPath:        ${cryptoPath}`);
  console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
  console.log(`certPath:          ${certPath}`);
  console.log(`tlsCertPath:       ${tlsCertPath}`);
  console.log(`peerEndpoint:      ${peerEndpoint}`);
  console.log(`peerHostAlias:     ${peerHostAlias}`);
}

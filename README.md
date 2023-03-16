# Set up the environment

Get the install script

```shell
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
```

Run the script to install the environment

```shell
./install-fabric.sh -h
```

# Start network

1. Create the test network and a channel (from the `test-network` folder).
   ```
   ./network.sh up createChannel -c mychannel -ca
   ```

1. Deploy the smart contract implementations (from the `test-network` folder).
   ```
   # To deploy the TypeScript chaincode implementation
   ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript/ -ccl typescript
   ```

# Call api

In backend source code, go to file `gateway.ts`, there are 3 variables:

```ts
const keyDirectoryPath = '/home/tienmanh/Documents/code/tim/test/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore';
const certPath = '/home/tienmanh/Documents/code/tim/test/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/cert.pem';
const tlsCertPath = '/home/tienmanh/Documents/code/tim/test/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt';
```

You need to change the path `/home/tienmanh/Documents/code/tim/test` to suitable for your local device.

After that, you can run the backend server by these commands:

```shell
npm install
npm run start:dev
```

There will be 5 apis:
1. Init ledger (you should run this api first to init the data)
2. Get all assets
3. Read asset by id
4. Create asset
5. Transfer asset

Sample body:
```json
{
    "assetId": "asset7",
    "color": "00000",
    "size": "4",
    "owner": "Manh",
    "appraisedValue": "5000"
}
```

5. Transfer asset

Sample body:
```json
{
    "assetId": "asset1",
    "newOwner": "Tien Manh"
}
```

**Note**: Data type of data passes to ledger must be string, so make sure all data you pass into body when call `create-asset` must be string.


const { ethers, network } = require(`hardhat`);

const firstReceiver = ''
const secondReceiver = ''
const thirdReceiver = ''
const owner = '0x39A6C7216E1406bA1771868b63Ccb2c3bBe183E5'

const deployParams = [owner, firstReceiver, secondReceiver, thirdReceiver]

const main = async () => {
    let accounts = await ethers.getSigners()
    let deployer = accounts[0]
    let nonce = await network.provider.send('eth_getTransactionCount', [deployer.address, 'latest']) - 1
    console.log(`Start deploing contracts. Deployer: ${deployer.address}`)

    const BSWLockFactory = await ethers.getContractFactory('BSWLock', deployer)
    const BSWLock = await BSWLockFactory.deploy(...deployParams, { nonce: ++nonce, gasLimit: 1e7})
    await BSWLock.deployed()
    console.log(`BSWLock contract deployed to ${BSWLock.address}`)
}

main().then(() => process.exit(0)).catch(e => console.error(e) && process.exit(1))

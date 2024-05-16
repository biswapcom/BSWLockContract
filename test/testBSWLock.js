const {expect} = require('chai');
const {ethers, network} = require('hardhat');

const ERC20ABI = [
    'function transfer(address,uint256) public',
    'function balanceOf(address) external view returns(uint)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
]

getERC20From_forking = async (from, ERC20_address, howMuch = module.exports.toBN(1), to) => {
    await network.provider.request({method: 'hardhat_impersonateAccount', params: [from]})
    await network.provider.send('hardhat_setBalance', [from, '0x10000000000000000000000000'])
    const ERC20_contract = new ethers.Contract(
        ERC20_address,
        ['function transfer(address,uint256) public'],
        await ethers.provider.getSigner(from)
    )
    await ERC20_contract.transfer(to || (await ethers.getSigners())[0].address, howMuch)
    await network.provider.request({method: 'hardhat_stopImpersonatingAccount', params: [from]})
}

passTime = async ms => {
    await network.provider.send('evm_increaseTime', [ms])
    await network.provider.send('evm_mine')
}

getTimestamp = async () => (await network.provider.send('eth_getBlockByNumber', ['latest', false])).timestamp

toBN = (n, power = 18) => ethers.BigNumber.from(10).pow(power).mul(n)

let BSWLockContract, bswLockContract, owner, firstRecever, secondReceiver, thirdReceiver, account, bsw, totalParts,
    partDuration,
    firstReceiverPartsLeft, firstReceiverFixedAmount;

before(async () => {
    BSWLockContract = await ethers.getContractFactory('BSWLock');
    [owner, firstRecever, secondReceiver, thirdReceiver, account] = await ethers.getSigners();
    bswLockContract = await BSWLockContract.deploy(account.address, firstRecever.address, secondReceiver.address, thirdReceiver.address);
    bsw = new ethers.Contract('0x965F527D9159dCe6288a2219DB51fc6Eef120dD1', ERC20ABI, owner);
    totalParts = await bswLockContract.totalParts();
    partDuration = await bswLockContract.partDuration();
    firstReceiverPartsLeft = await bswLockContract.firstReceiverPartsLeft();
    firstReceiverFixedAmount = await bswLockContract.firstReceiverFixedAmount();
});

describe('Lock tokens', async () => {

    it("Check ownership", async () => {
        expect(await bswLockContract.owner()).eq(account.address)
    });

    it("Get tokens", async () => {
        let amount = toBN(60000000);
        await getERC20From_forking('0xF977814e90dA44bFA03b6295A0616a897441aceC', bsw.address, amount, owner.address);
        expect(await bsw.balanceOf(owner.address)).eq(amount)
    });

    it("Should lock the specified amount of tokens", async function () {
        let lockAmount = toBN(50e6);
        await bsw.connect(owner).approve(bswLockContract.address, lockAmount);

        await expect(bswLockContract.connect(owner).lock(lockAmount))
            .changeTokenBalances(bsw, [owner, bswLockContract], [lockAmount.mul(-1), lockAmount]);
    });
    it("Check withdraw tokens before lock period end", async function () {
        await passTime(partDuration.div(2).toString())
        await expect(bswLockContract.connect(account).withdraw()).to.be.revertedWith("Withdraw: lock period is not over yet");
    });
    it("Check withdraw tokens", async function () {
        await passTime(partDuration.div(2).toString())
        let partAmount = await bswLockContract.partAmount()
        await expect(bswLockContract.connect(account).withdraw())
            .changeTokenBalances(
                bsw,
                [firstRecever, secondReceiver, thirdReceiver, bswLockContract],
                [
                    firstReceiverFixedAmount,
                    partAmount.sub(firstReceiverFixedAmount).div(2),
                    partAmount.sub(firstReceiverFixedAmount).div(2),
                    partAmount.mul(-1)
                ]
            )
    });
    it("Check withdraw tokens after pass 2 periods", async function () {
        await passTime(partDuration.mul(2).toString())
        let partAmount = await bswLockContract.partAmount()
        await expect(bswLockContract.connect(account).withdraw())
            .changeTokenBalances(
                bsw,
                [firstRecever, secondReceiver, thirdReceiver, bswLockContract],
                [
                    firstReceiverFixedAmount.mul(2),
                    partAmount.mul(2).sub(firstReceiverFixedAmount.mul(2)).div(2),
                    partAmount.mul(2).sub(firstReceiverFixedAmount.mul(2)).div(2),
                    partAmount.mul(2).mul(-1)
                ]
            )
    });
    it("Check withdraw tokens before lock ended", async function () {
        await passTime(partDuration.div(2).toString())
        let partAmount = await bswLockContract.partAmount()
        await expect(bswLockContract.connect(account).withdraw()).to.be.revertedWith("Withdraw: lock period is not over yet");
    });
    it("Check withdraw tokens 4-36", async function () {
        await passTime(partDuration.div(2).toString())
        let partAmount = await bswLockContract.partAmount()
        await expect(bswLockContract.connect(account).withdraw())
            .changeTokenBalances(
                bsw,
                [firstRecever, secondReceiver, thirdReceiver, bswLockContract],
                [
                    firstReceiverFixedAmount,
                    partAmount.sub(firstReceiverFixedAmount).div(2),
                    partAmount.sub(firstReceiverFixedAmount).div(2),
                    partAmount.mul(-1)
                ]
            )
    });
    it("Check withdraw after transfer token on contract 5/36", async function () {
        await passTime(partDuration.toString())
        const transferAmount = toBN(1e6);
        await bsw.connect(owner).transfer(bswLockContract.address, transferAmount);
        const balance = await bsw.balanceOf(bswLockContract.address);
        const withdrawnParts = await bswLockContract.withdrawnParts();
        const partAmount = balance.div(totalParts.sub(withdrawnParts))

        await expect(bswLockContract.connect(account).withdraw())
            .changeTokenBalances(
                bsw,
                [firstRecever, secondReceiver, thirdReceiver, bswLockContract],
                [
                    firstReceiverFixedAmount,
                    partAmount.sub(firstReceiverFixedAmount).div(2),
                    partAmount.sub(firstReceiverFixedAmount).div(2),
                    partAmount.mul(-1).add(1)
                ]
            )
    });
    it("Check withdraw all parts at the same time", async function () {
        await passTime(partDuration.mul(31).toString())
        const balance = await bsw.balanceOf(bswLockContract.address);
        const withdrawnParts = await bswLockContract.withdrawnParts();
        const partAmount = balance.div(totalParts.sub(withdrawnParts))
        await expect(bswLockContract.connect(account).withdraw())
            .changeTokenBalances(
                bsw,
                [firstRecever, secondReceiver, thirdReceiver, bswLockContract],
                [
                    firstReceiverFixedAmount.mul(5),
                    partAmount.mul(31).sub(firstReceiverFixedAmount.mul(5)).div(2),
                    partAmount.mul(31).sub(firstReceiverFixedAmount.mul(5)).div(2),
                    partAmount.mul(31).mul(-1).add(1)
                ]
            )
    });
    it("Check withdraw tokens before lock period end", async function () {
        await passTime(partDuration.toString())
        await expect(bswLockContract.connect(account).withdraw()).to.be.revertedWith("Withdraw: All parts withdrawn");
    });
    it("Check finalWithdraw", async function () {
        let balance = await bsw.balanceOf(bswLockContract.address);
        await expect(bswLockContract.finalWithdraw(bsw.address))
            .changeTokenBalances(bsw, [bswLockContract, secondReceiver], [balance.mul(-1), balance])
    });

});
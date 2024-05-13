require('dotenv').config()
require('@nomicfoundation/hardhat-chai-matchers')
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-gas-reporter')


module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		localhost: {
			url: "http://127.0.0.1:8545",
			blockGasLimit: 5e6,
			gasPrice: 5e9,
			timeout: 1_000_000
		},
		hardhat: {
			forking: {
				url: process.env.RPC
			}
		},
		testnetBSC: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545",
			chainId: 97,
			gasPrice: 20e9,
		},
		mainnetBSC: {
			url: process.env.RPC,
			chainId: 56,
			gasLimit: 50e18,
			gasPrice: 3e9,
			accounts: [process.env.PRIVAT_KEY_MAINNET]
		},
	},
	etherscan: {
		apiKey: process.env.BSCSCAN_API_KEY
	},
	solidity: {
		compilers: [
			{
				version: "0.8.24",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					}
				}
			}
			],
		outputSelection: {
			"*": {
				"*": ["storageLayout"]
			}
		}
	},
	paths: {
		sources: "./contracts",
		tests: "./test",
		cache: "./cache",
		artifacts: "./artifacts"
	},
	mocha: {
		timeout: 200000
	},
}

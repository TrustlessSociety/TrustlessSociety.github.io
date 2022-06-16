const { expect } = require('chai');
require('dotenv').config()

if (process.env.BLOCKCHAIN_NETWORK != 'hardhat') {
  console.error('Exited testing with network:', process.env.BLOCKCHAIN_NETWORK)
  process.exit(1);
}

async function deploy(name, ...params) {
  //deploy the contract
  const ContractFactory = await ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();

  return contract;
}

async function bindContract(key, name, contract, signers) {
  //attach contracts
  for (let i = 0; i < signers.length; i++) {
    const Contract = await ethers.getContractFactory(name, signers[i]);
    signers[i][key] = await Contract.attach(contract.address);
  }

  return signers;
}

function getRole(name) {
  if (!name || name === 'DEFAULT_ADMIN_ROLE') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  return '0x' + Buffer.from(ethers.utils.solidityKeccak256(['string'], [name]).slice(2), 'hex').toString('hex');
}

describe('CashCows Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners();
    this.base = 'https://ipfs.io/ipfs/Qm123abc/'
    this.preview = 'https://ipfs.io/ipfs/Qm123abc/preview.json'

    const nft = await deploy('CashCows', this.preview, signers[0].address)
    await bindContract('withNFT', 'CashCows', nft, signers)
    
    const [
      admin,
      tokenOwner1, 
      tokenOwner2
    ] = signers

    //make admin MINTER_ROLE, FUNDEE_ROLE, CURATOR_ROLE
    await admin.withNFT.grantRole(getRole('MINTER_ROLE'), admin.address)
    await admin.withNFT.grantRole(getRole('CURATOR_ROLE'), admin.address)
    
    this.signers = { 
      admin,
      tokenOwner1, 
      tokenOwner2
    }
  })
  
  it('Should not mint', async function () {
    const { admin, tokenOwner1 } = this.signers
    await expect(//sale not started
      tokenOwner1.withNFT.mint(3, { value: ethers.utils.parseEther('0.09') })
    ).to.be.revertedWith('InvalidCall()')
  })
  
  it('Should error when getting token URI', async function () {
    const { admin } = this.signers
    await expect(//token does not exist
      admin.withNFT.tokenURI(1)
    ).to.be.revertedWith('InvalidCall()')
  })

  it('Should whitelist mint', async function () {
    const { admin, tokenOwner1 } = this.signers
    const signature = await admin.signMessage(
      authorizeToken(tokenOwner1.address, 6)
    )
  
    await tokenOwner1.withNFT.authorize(6, signature, { value: ethers.utils.parseEther('0.18') })
    expect(await admin.withNFT.ownerOf(1)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(2)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(3)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(4)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(5)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(6)).to.equal(tokenOwner1.address)
  })

  it('Should not authorize', async function () {
    const { admin, tokenOwner1, tokenOwner2 } = this.signers

    const message1 = authorizeToken(tokenOwner1.address, 4)
    const signature1 = await admin.signMessage(message1)
    await expect(//already authorized
      tokenOwner1.withNFT.authorize(4, signature1, { value: ethers.utils.parseEther('0.12') })
    ).to.be.revertedWith('InvalidCall()')

    const message2 = authorizeToken(tokenOwner2.address, 2)
    const signature2 = await admin.signMessage(message2)
    await expect(//wrong amount
      tokenOwner2.withNFT.authorize(2, signature2, { value: ethers.utils.parseEther('0.05') })
    ).to.be.revertedWith('InvalidCall()')

    await expect(//wrong quantity
      tokenOwner2.withNFT.authorize(3, signature2, { value: ethers.utils.parseEther('0.09') })
    ).to.be.revertedWith('InvalidCall()')
  })

  it('Should start sale', async function () {  
    const { admin } = this.signers
    expect(await admin.withNFT.saleStarted()).to.equal(false)
    await admin.withNFT.startSale(false)
    expect(await admin.withNFT.saleStarted()).to.equal(false)
    await admin.withNFT.startSale(true)
    expect(await admin.withNFT.saleStarted()).to.equal(true)
  })

  it('Should mint', async function () {
    const { admin, tokenOwner1, tokenOwner2 } = this.signers
    await tokenOwner1.withNFT.mint(1, { value: ethers.utils.parseEther('0.03') })
    await tokenOwner2.withNFT.mint(1, { value: ethers.utils.parseEther('0.03') })
    await tokenOwner2.withNFT.mint(2, { value: ethers.utils.parseEther('0.06') })
    expect(await admin.withNFT.ownerOf(7)).to.equal(tokenOwner1.address)
    expect(await admin.withNFT.ownerOf(8)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(9)).to.equal(tokenOwner2.address)
    expect(await admin.withNFT.ownerOf(10)).to.equal(tokenOwner2.address)
  })

  it('Should not mint', async function () {
    const { tokenOwner1, tokenOwner2 } = this.signers
    await expect(//cant mint anymore
      tokenOwner1.withNFT.mint(5, { value: ethers.utils.parseEther('0.15') })
    ).to.be.revertedWith('InvalidCall()')

    await expect(//invalid amount
      tokenOwner2.withNFT.mint(1, { value: ethers.utils.parseEther('0.0299') })
    ).to.be.revertedWith('InvalidCall()')
  })

  it('Should withdraw', async function () {
    const { admin } = this.signers

    const startingBalance = parseFloat(
      ethers.utils.formatEther(await admin.getBalance())
    )

    await expect(//no base uri set
      admin.withNFT.withdraw()
    ).to.be.revertedWith('InvalidCall()')

    await admin.withNFT.setBaseURI(this.base)
    await admin.withNFT.withdraw()
    
    expect(parseFloat(
      ethers.utils.formatEther(await admin.getBalance())
      //also less gas
    ) - startingBalance).to.be.above(0.2988)
  })

  it('Should get the correct token URIs', async function () {
    const { admin } = this.signers

    for (let i = 1; i <= 8; i++) {
      expect(
        await admin.withNFT.tokenURI(i)
      ).to.equal(`${this.base}${i}.json`)
    }
  })
})
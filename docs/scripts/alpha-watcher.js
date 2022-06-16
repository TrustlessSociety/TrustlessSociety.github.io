(async () => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  //------------------------------------------------------------------//
  // Variables

  const zero = /^0x0+(dead)*$/i
  const web3 = MetaMaskSDK.web3()
  const network = MetaMaskSDK.network('ethereum')

  const alphas = {
    proof: {
      address: '0x08d7c0242953446436f34b4c78fe9da38c73668d',
      image: 'https://lh3.googleusercontent.com/ipAyQg6Xlgvwxma0Qp0a1gqdsZepRvHR4ZLsPN3mOFvIR1aznNiWFEgba2gcVqQwJS5BoJilLPrA2DRq2DVOnwKc3tDovmEdjR4qb-0'
    },
    bayc: {
      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      image: 'https://lh3.googleusercontent.com/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB'
    },
    moon: {
      address: '0x23581767a106ae21c074b2276d25e5c3e136a68b',
      image: 'https://lh3.googleusercontent.com/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5OLuyO3Z5PpJFSwdm7rq-TikAh7f5eUw338A2cy6HRH75'
    },
    punks: {
      address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      image: 'https://lh3.googleusercontent.com/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE'
    },
    doodles: {
      address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
      image: 'https://lh3.googleusercontent.com/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ'
    },
    azuki: {
      address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
      image: 'https://lh3.googleusercontent.com/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT'
    },
    cats: {
      address: '0x1a92f7381b9f03921564a437210bb9396471050c',
      image: 'https://lh3.googleusercontent.com/LIov33kogXOK4XZd2ESj29sqm_Hww5JSdO7AFn5wjt8xgnJJ0UpNV9yITqxra3s_LMEW1AnnrgOVB_hDpjJRA1uF4skI5Sdi_9rULi8'
    },
    mayc: {
      address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      image: 'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI'
    },
    nouns: {
      address: '0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03',
      image: 'https://lh3.googleusercontent.com/vfYB4RarIqixy2-wyfP4lIdK6fsOT8uNrmKxvYCJdjdRwAMj2ZjC2zTSxL-YKky0s-4Pb6eML7ze3Ouj54HrpUlfSWx52xF_ZK2TYw'
    }
  }

  const whales = {
    'eatbutt.eth': {
      address: '0xf2659a2b2b928a0555bf1596ebf2c30aa4b34a31',
      image: 'https://openseauserdata.com/files/3a0c016cec3123ea6a9a94637f23730b.jpg'
    }
  }

  const template = {
    row: document.getElementById('template-table-row').innerHTML
  }
  
  const results = document.querySelector('section.results table tbody')

  const blockNumber = await web3.eth.getBlockNumber()

  //------------------------------------------------------------------//
  // Functions

  const toRelative = (el, time, timeout = 0) => {
    setTimeout(() => {
      const now = Date.now()
      const msPerMinute = 60 * 1000;
      const msPerHour = msPerMinute * 60;
      const msPerDay = msPerHour * 24;
      const elapsed = now - time;

      if (elapsed < msPerMinute) {
        el.innerHTML = Math.round(elapsed/1000) + 's'
        return toRelative(el, time, 3000) 
      } else if (elapsed < msPerHour) {
        el.innerHTML = Math.round(elapsed/msPerMinute) + 'm'
        return toRelative(el, time, msPerMinute)   
      } else if (elapsed < msPerDay ) {
        el.innerHTML = Math.round(elapsed/msPerHour) + 'h'
        return toRelative(el, time, msPerHour)     
      } else {
        el.innerHTML = Math.round(elapsed/msPerDay) + 'd'
        return toRelative(el, time, msPerDay)   
      }
    }, timeout)
  }

  const fieldHas = (selector, value) => {
    const fields = Array.from(document.querySelectorAll(selector))
      .map(field => field.value)
      .filter(field => !!field)
    
   return !fields.length || fields.indexOf(value) !== -1
  }

  const render = ({ contract, date, hash, action, image, name, tokenId, owner, alias, groups }) => {
    const row = theme.toElement(template.row, {
      '{TX}': hash,
      '{COLOR}': ['sold', 'burnt'].indexOf(action) !== -1 ? 'danger': 'success',
      '{ACTION}': action.toUpperCase(),
      '{IMAGE}': image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
      '{CONTRACT_NAME}': name,
      '{TOKEN_ID}': tokenId,
      '{OWNER}': owner,
      '{OWNER_CAT}': alias,
      '{ICONS}': Object.keys(groups).map(name => `<img src="${alphas[name].image}" width="50" />`).join(' '),
      '{CONTRACT_ADDRESS}': contract
    })

    theme.hide('.panel-body .alert', true)
    results.prepend(row)
    window.doon(row)
    toRelative(
      row.querySelector('td.date'),
      date
    )

    if(!fieldHas('input.addresses', contract) 
      || !fieldHas('input.actions:checked', action.toUpperCase())
    ) {
      theme.hide(row, true)
    }

    const maxItems = 200
    if (results.children.length > maxItems) {
      for (let i = maxItems; i < results.children.length; i++) {
        results.removeChild(results.children[i])
      }
    }
  }

  //------------------------------------------------------------------//
  // Events

  web3.eth.subscribe('logs', {
    fromBlock: blockNumber - 10,
    topics: [
      //Mint/Transfer
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    ]
  }, async(error, event) => {
    if (error) notify('error', error)
    if (error || event.topics.length !== 4) return
    const sender = web3.eth.abi.decodeParameter('address', event.topics[1])
    const recipient = web3.eth.abi.decodeParameter('address', event.topics[2])
    const tokenId = Number(event.topics[3])
    const contract = network
      .addContract('nft', event.address,  blocknet.abi.erc721)
      .contract('nft')

    const date = (await web3.eth.getBlock(event.blockNumber)).timestamp * 1000
    const bought = { action: zero.test(sender) ? 'minted': 'bought', alphas: {} }
    const sold = { action: zero.test(recipient) ? 'burnt': 'sold', alphas: {} }

    for (const alpha in alphas) {
      const source = network
        .addContract('target', alphas[alpha].address, blocknet.abi.erc721)
        .contract('target')

      if (!zero.test(recipient) && (await (source.read().balanceOf(recipient))) > 0) {
        bought.alphas[alpha] = alphas[alpha]
      } else if (!zero.test(sender) && (await (source.read().balanceOf(sender))) > 0) {
        sold.alphas[alpha] = alphas[alpha]
      } 
    }

    for (const whale in whales) {
      if (whale.toLowerCase() === recipient.toLowerCase()) {
        bought.alias = whale
        bought.alphas[whale] = whales[whale]
      } else if (whale.toLowerCase() === sender.toLowerCase()) {
        sold.alias = whale
        sold.alphas[whale] = whales[whale]
      }
    }

    let json = {}
    try {
      const uri = await (contract.read().tokenURI(tokenId))
      if (uri.indexOf('data:') === 0) {
        json = atob(uri.split('base64,')[1])
      } else {
        const response = await fetch(`https://www.incept.asia/cors.php?proxy=${
          uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
        }`)
        json = await response.json()
      }
    } catch(e) {}

    const contractName = await (contract.read().name())

    if (!zero.test(recipient) && Object.keys(bought.alphas).length) {
      render({ 
        contract: contract.address, 
        date: date,
        hash: event.transactionHash, 
        action: bought.action, 
        image: json.image || '', 
        name: contractName, 
        tokenId: tokenId, 
        owner: recipient, 
        alias: bought.alias || recipient.substring(2, 7).toUpperCase(), 
        groups: bought.alphas
      })
    }

    if (!zero.test(sender) && Object.keys(sold.alphas).length) {
      render({ 
        contract: contract.address, 
        date: date,
        hash: event.transactionHash, 
        action: sold.action, 
        image: json.image || '', 
        name: contractName, 
        tokenId: tokenId, 
        owner: sender, 
        alias: sold.alias || sender.substring(2, 7).toUpperCase(), 
        groups: sold.alphas
      })
    }
  });

  document.getElementById('watch-form').addEventListener('submit', (e) => {
    e.preventDefault()
    return false
  })

  window.addEventListener('watch-submit', async (e) => {
    Array.from(results.querySelectorAll('tr')).forEach(row => {
      theme.hide(row, !fieldHas(
        'input.addresses', 
        row.getAttribute('data-contract')
      ) || !fieldHas(
        'input.actions:checked', 
        row.getAttribute('data-action')
      ))
    })
  })

  window.addEventListener('contract-add-click', async (e) => {
    const input = document.createElement('div')
    input.innerHTML = '<input class="form-control addresses" placeholder="eg. 0x..." type="text" />'
    e.for.parentNode.insertBefore(input, e.for)
  })

  //------------------------------------------------------------------//
  // Initialize

  window.doon('body')
})()
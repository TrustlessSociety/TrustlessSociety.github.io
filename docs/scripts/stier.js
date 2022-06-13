(async () => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)
  

  //------------------------------------------------------------------//
  // Variables

  const network = MetaMaskSDK.network('ethereum')

  const stiers = {
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

  const fields = {
    address: document.getElementById('address'),
    throttle: document.getElementById('throttle'),
    count: document.getElementById('count'),
    owners: document.getElementById('owners')
  }

  const template = {
    row: document.getElementById('template-table-row').innerHTML
  }
  
  const status = document.querySelector('div.progress-status')
  const progress = document.querySelector('div.progress-bar-meter')
  const results = document.querySelector('section.results table tbody')

  //------------------------------------------------------------------//
  // Classes

  class TaskRunner {
    constructor(maxThreads = 1) {
      this.done = 0
      this.queue = []
      this.progress = []
      this.retried = {}
      this.threads = 0
      this.maxThreads = maxThreads
    }

    async init(contract) {
      this.contract = MetaMaskSDK
        .network('ethereum')
        .addContract('target', contract, blocknet.abi.erc721)
        .contract('target')

      this.supply = parseInt(await (this.contract.read().totalSupply()))
    }

    async task(tokenId, found) {
      const holder = await (this.contract.read().ownerOf(tokenId))
      const hits = {}
      for (const stier in stiers) {
        const address = stiers[stier].address
        const source = network
          .addContract('target', address, blocknet.abi.erc721)
          .contract('target')
        
        const balance = await (source.read().balanceOf(holder))
        if (balance > 0) {
          hits[stier] = stiers[stier]
        }
      }

      if (Object.keys(hits).length) {
        found(tokenId, holder, hits)
      }
    }

    thread(resolve, found, progress, error) {
      //if queue is empty
      if (!this.queue.length) {
        //if there is nothing in progress
        if (!this.progress.length) return resolve()
        //we cant do anything
        return
      }
      //get token id
      const tokenId = this.queue.shift()
      //if it's already in progress
      if (this.progress.indexOf(tokenId) !== -1) {
        //move on to the next one
        return this.thread(resolve, found, progress, error)
      }
      //set this in progress
      this.progress.push(tokenId)
      this.task(tokenId, found).then(_ => {
        this.done++
        //remove from progress
        if (this.progress.indexOf(tokenId) !== -1) {
          this.progress.splice(this.progress.indexOf(tokenId), 1)
        }
        //if nothing in queue and nothing in progress then we are done
        if (!this.queue.length && !this.progress.length) return resolve()
        //otherwise, move on to the next one
        this.thread(resolve, found, progress, error)
      }).catch(e => {
        //remove from progress
        if (this.progress.indexOf(tokenId) !== -1) {
          this.progress.splice(this.progress.indexOf(tokenId), 1)
        }
        const retry = this._retry(tokenId)
        //report this error
        error(e, tokenId, retry)
        //okay to retry?
        if (retry) {
          this.queue.push(tokenId)
          //move on to the next one
          this.thread(resolve, found, progress, error)
        }
      })
      //report progess
      progress(tokenId, this.done, this.queue.length, this.progress.length)
    }

    run(found, progress, error) {
      //build queue
      this.queue = []
      for (let i = 0; i < this.supply; i++) {
        this.queue.push(i + 1)
      }
      return new Promise(resolve => {
        for (let i = 0; i < this.maxThreads; i++) {
          this.thread(resolve, found, progress, error)
        }
      })
    }

    _retry(tokenId) {
      if (!this.retried[tokenId]) {
        this.retried[tokenId] = 0
      }

      return (++this.retried[tokenId]) < 5
    }
  }

  //------------------------------------------------------------------//
  // Events

  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault()
    return false
  })

  window.addEventListener('search-submit', async (e) => {
    const button = e.for.querySelector('button')
    //ignore double click
    if (theme.isDisabled(button)) {
      return
    }
    if (!fields.address.value.trim().length) {
      notify('error', 'Missing contract address')
      return
    }

    //disable button
    theme.disable(button, true)
    button.innerHTML = 'Working...'
    results.innerHTML = ''

    const throttle = parseInt(fields.throttle.value) || 10
    const address = fields.address.value.trim()
    const runner = new TaskRunner(throttle)

    const owners = []
    let count = 0
  
    try {
      //setup the contract and get supply
      await runner.init(address)
      //run the task runner
      await runner.run(async (tokenId, owner, stiers) => {
        let image = ''
        try {
          const uri = await (runner.contract.read().tokenURI(tokenId))
          const response = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'))
          const json = await response.json()
          image = json.image
        } catch(e) {}
        
        const row = theme.toElement(template.row, {
          '{INDEX}': ++count,
          '{IMAGE}': image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
          '{TOKEN_ID}': tokenId,
          '{OWNER}': owner,
          '{ICONS}': Object.keys(stiers).map(name => `<img src="${stiers[name].image}" width="50" />`).join(' '),
          '{CONTRACT}': address
        })
  
        results.appendChild(row)
        window.doon(row)

        if (owners.indexOf(owner) === -1) {
          owners.push(owner)
        }
        fields.owners.innerHTML = owners.length
        fields.count.innerHTML = count
      }, (id, done) => {
        //update status
        status.innerHTML = `Downloading Token #${id}`
        progress.style.width = `${(done / runner.supply) * 100}%`
      }, (e, id, retry) => {
        //on error, notify
        if (retry) {
          notify('error', `Error on #${id}: ${e.message} - Retrying...`)
        } else {
          notify('error', `Error on #${id}: ${e.message} - Retried too many times.`)
        }
      })
    } catch(error) {
      //enable button
      theme.disable(button, false)
      button.innerHTML = 'Check'
      return notify('error', error.message)
    }

    //enable button
    theme.disable(button, false)
    progress.style.width = '100%'
    button.innerHTML = 'Check'
    status.innerHTML = '100% Complete'
  })

  //------------------------------------------------------------------//
  // Initialize

  window.doon('body')
})()
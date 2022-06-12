(async() => {
  //sets up the MM SDK
  MetaMaskSDK.setup(blocknet)

  const network = MetaMaskSDK.network('ethereum')

  //------------------------------------------------------------------//
  // Events

  window.addEventListener('connect-click', async (e) => {
    network.connectCB(() => {
      notify('error', 'Sorry, you are not a member.')
    }, () => {})
  })

  //------------------------------------------------------------------//
  // Initialize

  window.doon('body')
})()
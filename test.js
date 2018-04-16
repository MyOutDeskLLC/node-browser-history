let history = require('./index')

function testGetAllHistory () {
  console.log('***** RUNNING GET ALL HISTORY TEST *****')
  return new Promise(res => {
    history.getAllHistory(10).then(history => {
      console.log('PASS GET ALL HISTORY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAILED TO GET ALL HISTORY *****')
      throw (error)
    })
  })
}

function testGetChromeOnly () {
  console.log('***** RUNNING GET CHROME ONLY *****')
  return new Promise(res => {
    history.getChromeHistory(5).then(history => {
      console.log('PASS GET CHROME ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET CHROME ONLY *****')
      throw (error)
    })
  })
}

function testFireFoxOnly () {
  console.log('***** RUNNING GET FIREFOX ONLY *****')
  return new Promise(res => {
    history.getFirefoxHistory(60).then(history => {
      console.log('PASS GET FIREFOX ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET FIREFOX ONLY *****')
      throw (error)
    })
  })
}

function testSafariOnly () {
  console.log('***** RUNNING GET SAFARI ONLY *****')
  return new Promise(res => {
    history.getSafariHistory(60).then(history => {
      console.log('PASS GET SAFARI ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET SAFARI ONLY *****')
      throw (error)
    })
  })
}

function testOperaOnly () {
  console.log('***** RUNNING GET OPERA ONLY *****')
  return new Promise(res => {
    history.getOperaHistory(60).then(history => {
      console.log('PASS GET OPERA ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET OPERA ONLY *****')
      throw (error)
    })
  })
}

function testSeaMonkeyOnly () {
  console.log('***** RUNNING GET SEAMONKEY ONLY *****')
  return new Promise(res => {
    history.getSeaMonkeyHistory(60).then(history => {
      console.log('PASS GET SEAMONKEY ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET SEAMONKEY ONLY *****')
      throw (error)
    })
  })
}

function testVivaldiOnly () {
  console.log('***** RUNNING GET VIVALDI ONLY *****')
  return new Promise(res => {
    history.getVivaldiHistory(60).then(history => {
      console.log('PASS GET VIVALDI ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET VIVALDI ONLY *****')
      throw (error)
    })
  })
}

function testMaxthonOnly () {
  console.log('***** RUNNING GET MAXTHON ONLY *****')
  return new Promise(res => {
    history.getMaxthonHistory(60).then(history => {
      console.log('PASS GET MAXTHON ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET MAXTHON ONLY *****')
      throw (error)
    })
  })
}

function testInternetExplorerOnly () {
  if (process.platform !== 'win32') {
    console.log('Internet explorer not supported on Mac')
    return
  }
  console.log('***** RUNNING GET INTERNET EXPLORER ONLY *****')
  return new Promise(res => {
    history.getIEHistory(60).then(history => {
      console.log('PASS GET INTERNET EXPLORER ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET INTERNET EXPLORER ONLY *****')
      throw (error)
    })
  })
}

function testTorchOnly () {
  console.log('***** RUNNING GET TORCH ONLY *****')
  return new Promise(res => {
    history.getTorchHistory(60).then(history => {
      console.log('PASS GET TORCH ONLY')
      console.log(history)
      res(history)
    }, error => {
      console.log('***** FAIL TO GET TORCH ONLY *****')
      throw (error)
    })
  })
}

let tests = [
  //testGetChromeOnly(),
  //testFireFoxOnly(),
  //testSafariOnly(),
  //testOperaOnly(),
  //testSeaMonkeyOnly(),
  //testVivaldiOnly(),
  //testMaxthonOnly(),
  //testInternetExplorerOnly(),
  //testTorchOnly(),
  // testGetAllHistory()
]

//Promise.all(tests).then(() => {
//  console.log('PASSING ALL TESTS')
//  process.exit(0)
//}, error => {
//  process.exit(error)
//})

testGetAllHistory()

// setInterval(()=>{
//   testGetAllHistory();
// },2000)





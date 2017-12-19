const path    = require('path'),
      fs      = require('fs'),
      sqlite3 = require('sqlite3').verbose(),
      uuidV4  = require('uuid/v4'),
      moment  = require('moment')

let edge                       = null,
    browserHistoryDllPath      = '',
    getInternetExplorerHistory = null,
    browsers                   = require('./browsers')

if (process.platform === 'win32') {
  // Check to see if electron is installed for people that want to use this with any electron applications
  edge = process.versions.electron ? require('electron-edge-js') : require('edge-js')

  if (!process.env.NODE_ENV) {
    browserHistoryDllPath = path.resolve(path.join(__dirname, 'IEHistoryFetcher.dll'))

  }
  //When using in electron register this dll as an external resource in your package.json file
  else if (process.env.NODE_ENV === 'development') {
    browserHistoryDllPath      = path.join(__dirname, '..', '..','src','renderer','assets','dlls', 'IEHistoryFetcher.dll')
  }
  else{
    browserHistoryDllPath      = path.join(__dirname, '..', '..','..','src','renderer','assets','dlls', 'IEHistoryFetcher.dll')
  }
  getInternetExplorerHistory = edge.func(
    {
      assemblyFile: browserHistoryDllPath,
      typeName:     'BrowserHistory.Fetcher',
      methodName:   'getInternetExplorer'
    })
}

let allBrowserRecords = []

/**
 * Runs the the proper function for the given browser. Some browsers follow the same standards as
 * chrome and firefox others have their own syntax.
 * Returns an empty array or an array of browser record objects
 * @param paths
 * @param browserName
 * @param historyTimeLength
 * @returns {Promise<array>}
 */
function getBrowserHistory (paths = [], browserName, historyTimeLength) {
  return new Promise((resolve, reject) => {
    if (browserName === browsers.FIREFOX || browserName === browsers.SEAMONKEY) {
      getMozillaBasedBrowserRecords(paths, browserName, historyTimeLength).then(foundRecords => {
        allBrowserRecords = allBrowserRecords.concat(foundRecords)
        resolve(foundRecords)
      }, error => {
        reject(error)
      })
    }
    else if (browserName === browsers.CHROME || browserName === browsers.OPERA || browserName === browsers.TORCH ||
      browserName === browsers.VIVALDI) {
      getChromeBasedBrowserRecords(paths, browserName, historyTimeLength).then(foundRecords => {
        allBrowserRecords = allBrowserRecords.concat(foundRecords)
        resolve(foundRecords)
      }, error => {
        reject(error)
      })
    }
    else if (browserName === browsers.MAXTHON) {
      getMaxthonBasedBrowserRecords(paths, browserName, historyTimeLength).then(foundRecords => {
        allBrowserRecords = allBrowserRecords.concat(foundRecords)
        resolve(foundRecords)
      }, error => {
        reject(error)
      })
    }
    else if (browserName === browsers.SAFARI) {
      getSafariBasedBrowserRecords(paths, browserName, historyTimeLength).then(foundRecords => {
        allBrowserRecords = allBrowserRecords.concat(foundRecords)
        resolve(foundRecords)
      }, error => {
        reject(error)
      })
    }

    else if (browserName === browsers.INTERNETEXPLORER) {
      //Only do this on Windows we have to do t his here because the DLL manages this
      if (process.platform !== 'win32') {
        resolve()
      }
      getInternetExplorerBasedBrowserRecords(historyTimeLength).then(foundRecords => {
        allBrowserRecords = allBrowserRecords.concat(foundRecords)
        resolve(allBrowserRecords)
      }, error => {
        reject(error)
      })
    }

  })
}

function getInternetExplorerBasedBrowserRecords (historyTimeLength) {
  let internetExplorerHistory = []
  return new Promise((resolve, reject) => {
    getInternetExplorerHistory(null, (error, s) => {
      if (error) {
        throw(error)
      }
      else {
        let currentTime    = moment.utc()
        let fiveMinutesAgo = currentTime.subtract(historyTimeLength, 'minutes')
        s.forEach(record => {
          let lastVisited = moment.utc(record.LastVisited)
          if (lastVisited > fiveMinutesAgo) {
            internetExplorerHistory.push(new Promise(res => {
              let newRecord = {

                title:    record.Title,
                utc_time: lastVisited.valueOf(),
                url:      record.URL,
                browser:  browsers.INTERNETEXPLORER
              }
              res(newRecord)
            }))
          }
        })
        Promise.all(internetExplorerHistory).then((foundRecords) => {
          resolve(foundRecords)
        })
      }
    })
  })
}

function getChromeBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = []
  let h              = []
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      return resolve(browserHistory)
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {
          let newDbPath   = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite')
          //Assuming the sqlite file is locked so lets make a copy of it
          let readStream  = fs.createReadStream(paths[i]),
              writeStream = fs.createWriteStream(newDbPath),
              stream      = readStream.pipe(writeStream)

          stream.on('finish', () => {
            let db = new sqlite3.Database(newDbPath)
            db.serialize(() => {
              db.each(
                'SELECT title, last_visit_time, url from urls WHERE DATETIME (last_visit_time/1000000 + (strftime(\'%s\', \'1601-01-01\')), \'unixepoch\')  >= DATETIME(\'now\', \'-' +
                historyTimeLength + ' minutes\')',
                function (err, row) {
                  if (err) {
                    reject(err)
                  }
                  else {
                    let t = moment.unix(row.last_visit_time / 1000000 - 11644473600)
                    browserHistory.push({
                      title:    row.title,
                      utc_time: t.valueOf(),
                      url:      row.url,
                      browser:  browserName
                    })
                  }
                })
              db.close(() => {
                fs.unlink(newDbPath, (err) => {
                  if (err) {
                    return reject(err)
                  }
                })
                res()
              })
            })
          })
        }))
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory)
    })
  })
}

function getMozillaBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = [],
      h              = []
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      resolve(browserHistory)
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {

          let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite')

          //Assuming the sqlite file is locked so lets make a copy of it
          const originalDB = new sqlite3.Database(paths[i])
          originalDB.serialize(() => {
            // This has to be called to merge .db-wall, the in memory db, to disk so we can access the history when
            // the browser is open
            originalDB.run('PRAGMA wal_checkpoint(FULL)')
            originalDB.close(() => {

              //Assuming the sqlite file is locked so lets make a copy of it
              let readStream  = fs.createReadStream(paths[i]),
                  writeStream = fs.createWriteStream(newDbPath),
                  stream      = readStream.pipe(writeStream)

              stream.on('finish', function () {
                const db = new sqlite3.Database(newDbPath)
                db.serialize(function () {
                  db.each(
                    'SELECT title, last_visit_date, url from moz_places WHERE DATETIME (last_visit_date/1000000, \'unixepoch\')  >= DATETIME(\'now\', \'-' +
                    historyTimeLength + ' minutes\')',
                    function (err, row) {
                      if (err) {
                        reject(err)
                      }
                      else {
                        let t = moment.unix(row.last_visit_date / 1000000)
                        browserHistory.push({
                          title:    row.title,
                          utc_time: t.valueOf(),
                          url:      row.url,
                          browser:  browserName
                        })
                      }
                    })
                  db.close(() => {
                    fs.unlink(newDbPath, (err) => {
                      if (err) {
                        return reject(err)
                      }
                    })
                    res()
                  })
                })
              })
            })
          })
        }))
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory)
    })
  })

}

function getMaxthonBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = [],
      h              = []
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      resolve(browserHistory)
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {

          let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.db')

          //Assuming the sqlite file is locked so lets make a copy of it
          const originalDB = new sqlite3.Database(paths[i])
          originalDB.serialize(() => {
            // This has to be called to merge .db-wall, the in memory db, to disk so we can access the history when
            // safari is open
            originalDB.run('PRAGMA wal_checkpoint(FULL)')
            originalDB.close(() => {
              let readStream  = fs.createReadStream(paths[i]),
                  writeStream = fs.createWriteStream(newDbPath),
                  stream      = readStream.pipe(writeStream)

              stream.on('finish', function () {
                const db = new sqlite3.Database(newDbPath)
                db.serialize(() => {
                  db.run('PRAGMA wal_checkpoint(FULL)')
                  db.each(
                    'SELECT `zlastvisittime`, `zhost`, `ztitle`, `zurl` FROM   zmxhistoryentry WHERE  Datetime (`zlastvisittime` + 978307200, \'unixepoch\') >= Datetime(\'now\', \'-' +
                    historyTimeLength + ' minutes\')',
                    function (err, row) {
                      if (err) {
                        reject(err)
                      }
                      else {
                        let t = moment.unix(Math.floor(row.ZLASTVISITTIME + 978307200))
                        browserHistory.push(
                          {
                            title:    row.ZTITLE,
                            utc_time: t.valueOf(),
                            url:      row.ZURL,
                            browser:  browserName
                          })
                      }
                    })

                  db.close(() => {
                    fs.unlink(newDbPath, (err) => {
                      if (err) {
                        return reject(err)
                      }
                    })
                    res()
                  })
                })
              })
            })

          })
          //fs.createWriteStream(newWallDbPath);

        }))
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory)
    })
  })
}

function getSafariBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = [],
      h              = []
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      resolve(browserHistory)
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {

          let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.db')

          //Assuming the sqlite file is locked so lets make a copy of it
          const originalDB = new sqlite3.Database(paths[i])
          originalDB.serialize(() => {
            // This has to be called to merge .db-wall, the in memory db, to disk so we can access the history when
            // safari is open
            originalDB.run('PRAGMA wal_checkpoint(FULL)')
            originalDB.close(() => {
              let readStream  = fs.createReadStream(paths[i]),
                  writeStream = fs.createWriteStream(newDbPath),
                  stream      = readStream.pipe(writeStream)

              stream.on('finish', function () {
                const db = new sqlite3.Database(newDbPath)
                db.serialize(() => {
                  db.run('PRAGMA wal_checkpoint(FULL)')
                  db.each(
                    'SELECT i.id, i.url, v.title, v.visit_time FROM history_items i INNER JOIN history_visits v on i.id = v.history_item WHERE DATETIME (v.visit_time + 978307200, \'unixepoch\')  >= DATETIME(\'now\', \'-' +
                    historyTimeLength + ' minutes\')',
                    function (err, row) {
                      if (err) {
                        reject(err)
                      }
                      else {
                        let t = moment.unix(Math.floor(row.visit_time + 978307200))
                        browserHistory.push(
                          {
                            title:    row.title,
                            utc_time: t.valueOf(),
                            url:      row.url,
                            browser:  browserName
                          })
                      }
                    })

                  db.close(() => {
                    fs.unlink(newDbPath, (err) => {
                      if (err) {
                        return reject(err)
                      }
                    })
                    res()
                  })
                })
              })
            })

          })
          //fs.createWriteStream(newWallDbPath);

        }))
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory)
    })
  })
}

function getMicrosoftEdgePath (microsoftEdgePath) {
  return new Promise(function (resolve, reject) {
    fs.readdir(microsoftEdgePath, function (err, files) {
      if (err) {
        resolve(null)
        return
      }
      for (let i = 0; i < files.length; i++) {
        if (files[i].indexOf('Microsoft.MicrosoftEdge') !== -1) {
          microsoftEdgePath = path.join(
            microsoftEdgePath, files[i], 'AC', 'MicrosoftEdge', 'User', 'Default', 'DataStore', 'Data',
            'nouser1')
          break
        }
      }
      fs.readdir(microsoftEdgePath, function (err2, files2) {
        if (err) {
          resolve(null)
        }
        //console.log(path.join(microsoftEdgePath, files2[0], "DBStore", "spartan.edb"));
        resolve(path.join(microsoftEdgePath, files2[0], 'DBStore', 'spartan.edb'))
      })
    })
  })
}

function getFirefoxHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.firefox, browsers.FIREFOX).then(foundPaths => {
        browsers.paths.firefox = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.firefox, browsers.FIREFOX, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => {
        reject(error)
      })
    }, error => {
      reject(error)
    })
  })
}

function getSeaMonkeyHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.seamonkey, browsers.SEAMONKEY).then(foundPaths => {
        browsers.paths.seamonkey = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.seamonkey, browsers.SEAMONKEY, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => { reject(error) })
    }, error => { reject(error) })
  })
}

function getChromeHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.chrome, browsers.CHROME).then(foundPaths => {
        browsers.paths.chrome = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.chrome, browsers.CHROME, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => { reject(error) })
    }, error => { reject(error) })
  })
}

function getOperaHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.opera, browsers.OPERA).then(foundPaths => {
        browsers.paths.opera = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.opera, browsers.OPERA, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => { reject(error) })
    }, error => { reject(error) })
  })
}

function getTorchHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.torch, browsers.TORCH).then(foundPaths => {
        browsers.paths.torch = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.torch, browsers.TORCH, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => { reject(error) })
    }, error => { reject(error) })
  })
}

function getSafariHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.safari, browsers.SAFARI).then(foundPaths => {
        browsers.paths.safari = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.safari, browsers.SAFARI, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => { reject(error) })
    }, error => { reject(error) })
  })
}

function getMaxthonHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.maxthon, browsers.MAXTHON).then(foundPaths => {
        browsers.paths.maxthon = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.maxthon, browsers.MAXTHON, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => { reject(error) })
    }, error => { reject(error) })
  })
}

function getVivaldiHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.vivaldi, browsers.VIVALDI).then(foundPaths => {
        browsers.paths.vivaldi = foundPaths
      })
    ]
    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.vivaldi, browsers.VIVALDI, historyTimeLength)
      ]
      Promise.all(getRecords).then((records) => {
        resolve(records)
      }, error => { reject(error) })
    }, error => { reject(error) })
  })
}

function getIEHistory (historyTimeLength = 5) {
  return new Promise((resolve, reject) => {
    let getRecords = [
      getBrowserHistory([], browsers.INTERNETEXPLORER, historyTimeLength)
    ]
    Promise.all(getRecords).then((records) => {
      resolve(records)
    }, error => { reject(error) })
  })
}

/**
 * Gets the history for the Specified browsers and time in minutes.
 * Returns an array of browser records.
 * @param historyTimeLength | Integer
 * @returns {Promise<array>}
 */
function getAllHistory (historyTimeLength = 5) {
  allBrowserRecords = []
  return new Promise((resolve, reject) => {
    let getPaths = [
      browsers.findPaths(browsers.paths.firefox, browsers.FIREFOX).then(foundPaths => {
        browsers.paths.firefox = foundPaths
      }),
      browsers.findPaths(browsers.paths.chrome, browsers.CHROME).then(foundPaths => {
        browsers.paths.chrome = foundPaths
      }),
      browsers.findPaths(browsers.paths.seamonkey, browsers.SEAMONKEY).then(foundPaths => {
        browsers.paths.seamonkey = foundPaths
      }),
      browsers.findPaths(browsers.paths.opera, browsers.OPERA).then(foundPaths => {
        browsers.paths.opera = foundPaths
      }),
      browsers.findPaths(browsers.paths.torch, browsers.TORCH).then(foundPaths => {
        browsers.paths.torch = foundPaths
      }),
      browsers.findPaths(browsers.paths.safari, browsers.SAFARI).then(foundPath => {
        browsers.paths.safari = foundPath
      }),
      browsers.findPaths(browsers.paths.seamonkey, browsers.SEAMONKEY).then(foundPath => {
        browsers.paths.seamonkey = foundPath
      }),
      browsers.findPaths(browsers.paths.maxthon, browsers.MAXTHON).then(foundPath => {
        browsers.paths.maxthon = foundPath
      }),
      browsers.findPaths(browsers.paths.vivaldi, browsers.VIVALDI).then(foundPath => {
        browsers.paths.vivaldi = foundPath
      })
    ]

    Promise.all(getPaths).then(() => {
      let getRecords = [
        getBrowserHistory(browsers.paths.firefox, browsers.FIREFOX, historyTimeLength),
        getBrowserHistory(browsers.paths.seamonkey, browsers.SEAMONKEY, historyTimeLength),
        getBrowserHistory(browsers.paths.chrome, browsers.CHROME, historyTimeLength),
        getBrowserHistory(browsers.paths.opera, browsers.OPERA, historyTimeLength),
        getBrowserHistory(browsers.paths.torch, browsers.TORCH, historyTimeLength),
        getBrowserHistory(browsers.paths.safari, browsers.SAFARI, historyTimeLength),
        getBrowserHistory(browsers.paths.vivaldi, browsers.VIVALDI, historyTimeLength),
        getBrowserHistory(browsers.paths.seamonkey, browsers.SEAMONKEY, historyTimeLength),
        getBrowserHistory(browsers.paths.maxthon, browsers.MAXTHON, historyTimeLength),

        //No Path because this is handled by the dll
        getBrowserHistory([], browsers.INTERNETEXPLORER, historyTimeLength)

      ]
      Promise.all(getRecords).then(() => {
        resolve(allBrowserRecords)
      }, error => {
        reject(error)
      })
    }, error => {
      reject(error)
    })

  })
}

module.exports = {
  getAllHistory,
  getFirefoxHistory,
  getSeaMonkeyHistory,
  getChromeHistory,
  getOperaHistory,
  getTorchHistory,
  getSafariHistory,
  getMaxthonHistory,
  getVivaldiHistory,
  getIEHistory
}


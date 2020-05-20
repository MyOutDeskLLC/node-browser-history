const path    = require("path"),
      fs      = require("fs"),
      uuidV4  = require("uuid/v4"),
      moment  = require("moment");
const sqlite3Async = require('sqlite-async')

let edge                       = null,
    browserHistoryDllPath      = "",
    getInternetExplorerHistory = null,
    browsers                   = require("./browsers")

if (process.platform === "win32") {
  edge = require("electron-edge-js");

  if (fs.existsSync(
    path.resolve(path.join(__dirname, "..", "..", "src", "renderer", "assets", "dlls", "IEHistoryFetcher.dll")))) {
    browserHistoryDllPath = path.join(
      __dirname, "..", "..", "src", "renderer", "assets", "dlls", "IEHistoryFetcher.dll")
  }
  else if (fs.existsSync(
    path.join(__dirname, "..", "..", "..", "src", "renderer", "assets", "dlls", "IEHistoryFetcher.dll"))) {
    browserHistoryDllPath = path.join(
      __dirname, "..", "..", "..", "src", "renderer", "assets", "dlls", "IEHistoryFetcher.dll")
  }
  else {
    browserHistoryDllPath = path.resolve(path.join(__dirname, "dlls", "IEHistoryFetcher.dll"))
  }

  getInternetExplorerHistory = edge.func(
    {
      assemblyFile: browserHistoryDllPath,
      typeName: "BrowserHistory.Fetcher",
      methodName: "getInternetExplorer"
    })
}

/**
 * Runs the the proper function for the given browser. Some browsers follow the same standards as
 * chrome and firefox others have their own syntax.
 * Returns an empty array or an array of browser record objects
 * @param paths
 * @param browserName
 * @param historyTimeLength
 * @returns {Promise<array>}
 */
async function getBrowserHistory (paths = [], browserName, historyTimeLength) {
    switch (browserName) {
      case browsers.FIREFOX:
      case browsers.SEAMONKEY:
        return await getMozillaBasedBrowserRecords(paths, browserName, historyTimeLength)

      case browsers.CHROME:
      case browsers.OPERA:
      case browsers.TORCH:
      case browsers.VIVALDI:
      case browsers.BRAVE:
        return await getChromeBasedBrowserRecords(paths, browserName, historyTimeLength)

      case browsers.MAXTHON:
        return await getMaxthonBasedBrowserRecords(paths, browserName, historyTimeLength)

      case browsers.SAFARI:
        return await getSafariBasedBrowserRecords(paths, browserName, historyTimeLength)

      case browsers.INTERNETEXPLORER:
        //Only do this on Windows we have to do t his here because the DLL manages this
        if (process.platform !== "win32") {
          return []
        }
        return await getInternetExplorerBasedBrowserRecords(historyTimeLength)

      default:
        return []
    }
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
        let fiveMinutesAgo = currentTime.subtract(historyTimeLength, "minutes")
        s.forEach(record => {
          let lastVisited = moment.utc(record.LastVisited)
          if (lastVisited > fiveMinutesAgo) {
            if (!record.URL.startsWith("file:///")) {
              internetExplorerHistory.push({
                title: record.Title,
                utc_time: lastVisited.valueOf(),
                url: record.URL,
                browser: browsers.INTERNETEXPLORER
              })
            }
          }
        })
        resolve(internetExplorerHistory)
      }
    })
  })
}

async function getChromeBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = [];
  if (!paths || paths.length === 0) {
    return browserHistory;
  }
  for (let p in paths) {
    if (paths.hasOwnProperty(p) && paths[p] !== "") {
      let newDbPath   = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + ".sqlite")
      //Assuming the sqlite file is locked so lets make a copy of it
      await fs.copyFileSync(paths[p], newDbPath);
      const db = await sqlite3Async.open(newDbPath);
      await db.each(
        "SELECT title, last_visit_time, url from urls WHERE DATETIME (last_visit_time/1000000 + (strftime('%s', '1601-01-01')), 'unixepoch')  >= DATETIME('now', '-" +
        historyTimeLength + " minutes')",
        function (err, row) {
          if (err) {
            console.error(err);
          }
          else {
            let t = moment.unix(row.last_visit_time / 1000000 - 11644473600)
            browserHistory.push({
              title: row.title,
              utc_time: t.valueOf(),
              url: row.url,
              browser: browserName
            })
          }
        });
      await db.close();
      fs.unlink(newDbPath, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  }
  return browserHistory;
}

async function getMozillaBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = [];
  if (!paths || paths.length === 0) {
    return browserHistory;
  }
  for (let i = 0; i < paths.length; i++) {
    if (paths[i] || paths[i] !== "") {
      const originalDB = await sqlite3Async.open(paths[i]);
      let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + ".sqlite")
      try {
        await originalDB.run("PRAGMA journal_mode = WAL");
        await originalDB.run("PRAGMA wal_checkpoint(FULL)")
      } catch (e) {
        await originalDB.close(async () => {
          console.log('Original DB Closed in catch');
          await fs.copyFileSync(paths[i], newDbPath);
          const newDb = await sqlite3Async.open(newDbPath);
          await newDb.each(
            "SELECT title, last_visit_date, url from moz_places WHERE DATETIME (last_visit_date/1000000, 'unixepoch')  >= DATETIME('now', '-" +
            historyTimeLength + " minutes')",
            function (err, row) {
              if (err) {
                reject(err)
              }
              else {
                let t = moment.unix(row.last_visit_date / 1000000)
                browserHistory.push({
                  title: row.title,
                  utc_time: t.valueOf(),
                  url: row.url,
                  browser: browserName
                })
              }
            });
          await newDb.close();
          fs.unlink(newDbPath, (err) => {
            if (err) {
              console.error(err);
            }
          });
        })
      }
    }
  }
  return browserHistory;
}

async function getMaxthonBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = [];
  async function _readFromMaxthonDb(newDb) {
    await newDb.each(
      "SELECT `zlastvisittime`, `zhost`, `ztitle`, `zurl` FROM   zmxhistoryentry WHERE  Datetime (`zlastvisittime` + 978307200, 'unixepoch') >= Datetime('now', '-" +
      historyTimeLength + " minutes')",
      function (err, row) {
        console.log('row', row);
        if (err) {
          console.error(err)
        }
        else {
          let t = moment.unix(Math.floor(row.ZLASTVISITTIME + 978307200))
          browserHistory.push(
            {
              title: row.ZTITLE,
              utc_time: t.valueOf(),
              url: row.ZURL,
              browser: browserName
            })
        }
      });
    await newDb.close();
  }
  if (!paths || paths.length === 0) {
    return browserHistory;
  }
  for (let i = 0; i < paths.length; i++) {
    if (paths[i] || paths[i] !== "") {
      let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + ".db")
      const originalDB = await sqlite3Async.open(paths[i]);
      try {
        await originalDB.run("PRAGMA journal_mode = WAL");
        await originalDB.run("PRAGMA wal_checkpoint(FULL)");
        await _readFromMaxthonDb(originalDB);
      } catch (e) {
        await originalDB.close(async () => {
          console.log('Original DB Closed in catch');
          await fs.copyFileSync(paths[i], newDbPath);
          const newDb = await sqlite3Async.open(newDbPath);
          await _readFromMaxthonDb(newDb)
          fs.unlink(newDbPath, (err) => {
            if (err) {
              console.error(err);
            }
          });

        })
      }
    }
  }
  return browserHistory;
}

async function getSafariBasedBrowserRecords (paths, browserName, historyTimeLength) {
  let browserHistory = [];
  async function _readFromSafariDb(db) {
    db.run("PRAGMA wal_checkpoint(FULL)")
    db.each(
      "SELECT i.id, i.url, v.title, v.visit_time FROM history_items i INNER JOIN history_visits v on i.id = v.history_item WHERE DATETIME (v.visit_time + 978307200, 'unixepoch')  >= DATETIME('now', '-" +
      historyTimeLength + " minutes')",
      function (err, row) {
        if (err) {
          reject(err)
        }
        else {
          let t = moment.unix(Math.floor(row.visit_time + 978307200))
          browserHistory.push(
            {
              title: row.title,
              utc_time: t.valueOf(),
              url: row.url,
              browser: browserName
            })
        }
      });
    await db.close();
  }
  if (!paths || paths.length === 0) {
    return browserHistory;
  }
  for (let i = 0; i < paths.length; i++) {
    if (paths[i] || paths[i] !== "") {
      let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + ".db")
      const originalDB = await sqlite3Async.open(paths[i]);
      try {
        await originalDB.run("PRAGMA journal_mode = WAL");
        await originalDB.run("PRAGMA wal_checkpoint(FULL)");
        await _readFromSafariDb(originalDB);
      } catch (e) {
        await originalDB.close(async () => {
          console.log('Original DB Closed in catch');
          await fs.copyFileSync(paths[i], newDbPath);
          const newDb = await sqlite3Async.open(newDbPath);
          await _readFromSafariDb(newDb)
          fs.unlink(newDbPath, (err) => {
            if (err) {
              console.error(err);
            }
          });

        })
      }
    }
  }
  return browserHistory;
}

function getMicrosoftEdgePath (microsoftEdgePath) {
  return new Promise(function (resolve, reject) {
    fs.readdir(microsoftEdgePath, function (err, files) {
      if (err) {
        resolve(null)
        return
      }
      for (let i = 0; i < files.length; i++) {
        if (files[i].indexOf("Microsoft.MicrosoftEdge") !== -1) {
          microsoftEdgePath = path.join(
            microsoftEdgePath, files[i], "AC", "MicrosoftEdge", "User", "Default", "DataStore", "Data",
            "nouser1")
          break
        }
      }
      fs.readdir(microsoftEdgePath, function (err2, files2) {
        if (err) {
          resolve(null)
        }
        //console.log(path.join(microsoftEdgePath, files2[0], "DBStore", "spartan.edb"));
        resolve(path.join(microsoftEdgePath, files2[0], "DBStore", "spartan.edb"))
      })
    })
  })
}

/**
 * Gets Firefox history
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getFirefoxHistory (historyTimeLength = 5) {
  browsers.browserDbLocations.firefox = browsers.findPaths(browsers.defaultPaths.firefox, browsers.FIREFOX);
  const records = await getBrowserHistory(browsers.browserDbLocations.firefox, browsers.FIREFOX, historyTimeLength);
  return records;
}

/**
 * Gets Seamonkey History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
function getSeaMonkeyHistory (historyTimeLength = 5) {
  let getPaths = [
    browsers.findPaths(browsers.defaultPaths.seamonkey, browsers.SEAMONKEY).then(foundPaths => {
      browsers.browserDbLocations.seamonkey = foundPaths
    })
  ]
  Promise.all(getPaths).then(() => {
    let getRecords = [
      getBrowserHistory(browsers.browserDbLocations.seamonkey, browsers.SEAMONKEY, historyTimeLength)
    ]
    Promise.all(getRecords).then((records) => {
      return records
    }, error => { throw error })
  }, error => { throw error })
}

/**
 * Gets Chrome History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getChromeHistory (historyTimeLength = 5) {
  browsers.browserDbLocations.chrome =  browsers.findPaths(browsers.defaultPaths.chrome, browsers.CHROME);
  const records = await getBrowserHistory(browsers.browserDbLocations.chrome, browsers.CHROME, historyTimeLength);
  return records;
}

/**
 * Get Opera History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getOperaHistory (historyTimeLength = 5) {
  let getPaths = [
    browsers.findPaths(browsers.defaultPaths.opera, browsers.OPERA).then(foundPaths => {
      browsers.browserDbLocations.opera = foundPaths
    })
  ]
  Promise.all(getPaths).then(() => {
    let getRecords = [
      getBrowserHistory(browsers.browserDbLocations.opera, browsers.OPERA, historyTimeLength)
    ]
    Promise.all(getRecords).then((records) => {
      return records
    }, error => { throw error })
  }, error => { throw error })
}

/**
 * Get Torch History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getTorchHistory (historyTimeLength = 5) {
  let getPaths = [
    browsers.findPaths(browsers.defaultPaths.torch, browsers.TORCH).then(foundPaths => {
      browsers.browserDbLocations.torch = foundPaths
    })
  ]
  Promise.all(getPaths).then(() => {
    let getRecords = [
      getBrowserHistory(browsers.browserDbLocations.torch, browsers.TORCH, historyTimeLength)
    ]
    Promise.all(getRecords).then((records) => {
      return records
    }, error => { throw error })
  }, error => { throw error })
}

/**
 * Get Brave History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getBraveHistory (historyTimeLength = 5) {
  let getPaths = [
    browsers.findPaths(browsers.defaultPaths.brave, browsers.BRAVE).then(foundPaths => {
      browsers.browserDbLocations.brave = foundPaths
    })
  ]
  Promise.all(getPaths).then(() => {
    let getRecords = [
      getBrowserHistory(browsers.browserDbLocations.brave, browsers.BRAVE, historyTimeLength)
    ]
    Promise.all(getRecords).then((records) => {
      return records
    }, error => { throw error })
  }, error => { throw error })
}

/**
 * Get Safari History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getSafariHistory (historyTimeLength = 5) {
  browsers.browserDbLocations.safari = browsers.findPaths(browsers.defaultPaths.safari, browsers.SAFARI);
  const records = getBrowserHistory(browsers.browserDbLocations.safari, browsers.SAFARI, historyTimeLength);
  return records;
}

/**
 * Get Maxthon History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getMaxthonHistory (historyTimeLength = 5) {
  browsers.browserDbLocations.maxthon = browsers.findPaths(browsers.defaultPaths.maxthon, browsers.MAXTHON);
  const records = await getBrowserHistory(browsers.browserDbLocations.maxthon, browsers.MAXTHON, historyTimeLength);
  return records;
}

/**
 * Get Vivaldi History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getVivaldiHistory (historyTimeLength = 5) {
  browsers.browserDbLocations.vivaldi = browsers.findPaths(browsers.defaultPaths.vivaldi, browsers.VIVALDI);
  const records = await getBrowserHistory(browsers.browserDbLocations.vivaldi, browsers.VIVALDI, historyTimeLength);
  return records;
}

/**
 * Get Internet Explorer History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
async function getIEHistory (historyTimeLength = 5) {
  let getRecords = [
    getBrowserHistory([], browsers.INTERNETEXPLORER, historyTimeLength)
  ]
  Promise.all(getRecords).then((records) => {
    return records
  }, error => { throw error })
}

/**
 * Gets the history for the Specified browsers and time in minutes.
 * Returns an array of browser records.
 * @param historyTimeLength | Integer
 * @returns {Promise<array>}
 */
async function getAllHistory (historyTimeLength = 5) {
  let allBrowserRecords = []

  browsers.browserDbLocations.firefox   = browsers.findPaths(browsers.defaultPaths.firefox, browsers.FIREFOX)
  browsers.browserDbLocations.chrome    = browsers.findPaths(browsers.defaultPaths.chrome, browsers.CHROME)
  browsers.browserDbLocations.seamonkey = browsers.findPaths(browsers.defaultPaths.seamonkey, browsers.SEAMONKEY)
  browsers.browserDbLocations.opera     = browsers.findPaths(browsers.defaultPaths.opera, browsers.OPERA)
  browsers.browserDbLocations.torch     = browsers.findPaths(browsers.defaultPaths.torch, browsers.TORCH)
  browsers.browserDbLocations.brave     = browsers.findPaths(browsers.defaultPaths.brave, browsers.BRAVE)
  browsers.browserDbLocations.safari    = browsers.findPaths(browsers.defaultPaths.safari, browsers.SAFARI)
  browsers.browserDbLocations.seamonkey = browsers.findPaths(browsers.defaultPaths.seamonkey, browsers.SEAMONKEY)
  browsers.browserDbLocations.maxthon   = browsers.findPaths(browsers.defaultPaths.maxthon, browsers.MAXTHON)
  browsers.browserDbLocations.vivaldi   = browsers.findPaths(browsers.defaultPaths.vivaldi, browsers.VIVALDI)

  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.firefox, browsers.FIREFOX, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.seamonkey, browsers.SEAMONKEY, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.chrome, browsers.CHROME, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.opera, browsers.OPERA, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.torch, browsers.TORCH, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.brave, browsers.BRAVE, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.safari, browsers.SAFARI, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.vivaldi, browsers.VIVALDI, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.seamonkey, browsers.SEAMONKEY, historyTimeLength))
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory(browsers.browserDbLocations.maxthon, browsers.MAXTHON, historyTimeLength))
  //No Path because this is handled by the dll
  allBrowserRecords = allBrowserRecords.concat(await getBrowserHistory([], browsers.INTERNETEXPLORER, historyTimeLength))

  return allBrowserRecords
}

module.exports = {
  getAllHistory,
  getFirefoxHistory,
  getSeaMonkeyHistory,
  getChromeHistory,
  getOperaHistory,
  getTorchHistory,
  getBraveHistory,
  getSafariHistory,
  getMaxthonHistory,
  getVivaldiHistory,
  getIEHistory
}


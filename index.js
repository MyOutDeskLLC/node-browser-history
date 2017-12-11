const path    = require('path'),
      fs      = require('fs'),
      sqlite3 = require('sqlite3').verbose(),
      uuidV4  = require('uuid/v4'),
      moment  = require('moment');

let records = [];

//Browser Names
const CHROME    = 'Google Chrome',
      FIREFOX   = 'Mozilla Firefox',
      TORCH     = 'Torch',
      OPERA     = 'Opera',
      SEAMONKEY = 'SeaMonkey',
      VIVALDI   = 'Vivaldi',
      SAFARI    = 'Safari',
      MAXTHON   = 'Maxthon';

/**
 * Find all files recursively in specific folder with specific extension, e.g:
 * findFilesInDir('./project/src', '.html') ==> ['./project/src/a.html','./project/src/build/index.html']
 * @param  {String} startPath    Path relative to this file or other file which requires this files
 * @param  {String} filter       Extension name, e.g: '.html'
 * @param regExp
 * @return {Array}               Result files with path string in an array
 */
function findFilesInDir (startPath, filter, regExp = new RegExp('.*')) {

  let results = [];

  if (!fs.existsSync(startPath)) {
    //console.log("no dir ", startPath);
    return results;
  }

  let files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    let filename = path.join(startPath, files[i]);
    if (!fs.existsSync(filename)) {
      //console.log('file doesn\'t exist ', startPath);
      return results;
    }
    let stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, filter, regExp)); //recurse
    }
    else if (filename.indexOf(filter) >= 0 && regExp.test(filename)) {
      //console.log('-- found: ', filename);
      results.push(filename);
    }
  }
  return results;
}

/**
 * Finds the path to the browsers DB file.
 * Returns an array of strings, paths, or an empty array
 * @param path
 * @param browserName
 * @returns {Promise<array>}
 */
function findPaths (path, browserName) {
  return new Promise(function (resolve, reject) {
    switch (browserName) {
      case FIREFOX:
        resolve(findFilesInDir(path, '.sqlite', /places.sqlite$/));
        break;
      case CHROME:
        resolve(findFilesInDir(path, 'History', /History$/));
        break;
      case TORCH:
        resolve(findFilesInDir(path, 'History', /History$/));
        break;
      case OPERA:
        resolve(findFilesInDir(path, 'History', /History$/));
        break;
      case SEAMONKEY:
        resolve(findFilesInDir(path, 'places.sqlite', /places.sqlite$/));
        break;
      case VIVALDI:
        resolve(findFilesInDir(path, '.sqlite'));
        break;
      case SAFARI:
        resolve(findFilesInDir(path, '.db', /History.db$/));
        break;
      case MAXTHON:
        resolve(findFilesInDir(path, '.dat', /History.dat$/));
      default:
        resolve([]);
        break;
    }
  });
}

/**
 * Runs the the proper function for the given browser. Some browsers follow the same standards as
 * chrome and firefox others have their own syntax.
 * Returns an empty array or an array of browser record objects
 * @param paths
 * @param browserName
 * @returns {Promise<array>}
 */
function getBrowserHistory (paths = [], browserName) {
  return new Promise((resolve, reject) => {
    if (browserName === FIREFOX || browserName === SEAMONKEY) {
      getMozillaBasedBrowserRecords(paths, browserName).then(foundRecords => {
        records = records.concat(foundRecords);
        resolve(records);
      }, error => {
        reject(error);
      });
    }
    else if (browserName === CHROME || browserName === OPERA || browserName === TORCH || browserName == VIVALDI) {
      getChromeBasedBrowserRecords(paths, browserName).then(foundRecords => {
        records = records.concat(foundRecords);
        resolve(records);
      }, error => {
        reject(error);
      });
    }
    else if (browserName === MAXTHON) {
      getMaxthonBasedBrowserRecords(paths, browserName).then(foundRecords => {
        records = records.concat(foundRecords);
        resolve(records);
      }, error => {
        reject(error);
      });
    }
    else if (browserName === SAFARI) {
      getSafariBasedBrowserRecords(paths, browserName).then(foundRecords => {
        records = records.concat(foundRecords);
        resolve(records);
      }, error => {
        reject(error);
      });
    }
  });
}

function getChromeBasedBrowserRecords (paths, browserName) {
  let browserHistory = [];
  let h              = [];
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      return resolve(browserHistory);
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {
          let newDbPath   = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite');
          //Assuming the sqlite file is locked so lets make a copy of it
          let readStream  = fs.createReadStream(paths[i]),
              writeStream = fs.createWriteStream(newDbPath),
              stream      = readStream.pipe(writeStream);

          stream.on('finish', () => {
            let db = new sqlite3.Database(newDbPath);
            db.serialize(() => {
              db.each(
                'SELECT title, last_visit_time, url from urls WHERE DATETIME (last_visit_time/1000000 + (strftime(\'%s\', \'1601-01-01\')), \'unixepoch\')  >= DATETIME(\'now\', \'-5 minutes\')',
                function (err, row) {
                  if (err) {
                    reject(err);
                  }
                  else {
                    let t = moment.unix(row.last_visit_time / 1000000 - 11644473600);
                    browserHistory.push({
                      title:    row.title,
                      utc_time: t.valueOf(),
                      url:      row.url,
                      browser:  browserName
                    });
                  }
                });
              db.close(() => {
                fs.unlink(newDbPath, (err) => {
                  if (err) {
                    return reject(err);
                  }
                });
                res();
              });
            });
          });
        }));
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory);
    });
  });
}

function getMozillaBasedBrowserRecords (paths, browserName) {
  let browserHistory = [],
      h              = [];
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      resolve(browserHistory);
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {

          let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite');

          //Assuming the sqlite file is locked so lets make a copy of it
          const originalDB = new sqlite3.Database(paths[i]);
          originalDB.serialize(() => {
            // This has to be called to merge .db-wall, the in memory db, to disk so we can access the history when
            // the browser is open
            originalDB.run('PRAGMA wal_checkpoint(FULL)');
            originalDB.close(() => {

              //Assuming the sqlite file is locked so lets make a copy of it
              let readStream  = fs.createReadStream(paths[i]),
                  writeStream = fs.createWriteStream(newDbPath),
                  stream      = readStream.pipe(writeStream);

              stream.on('finish', function () {
                const db = new sqlite3.Database(newDbPath);
                db.serialize(function () {
                  db.each(
                    'SELECT title, last_visit_date, url from moz_places WHERE DATETIME (last_visit_date/1000000, \'unixepoch\')  >= DATETIME(\'now\', \'-5 minutes\')',
                    function (err, row) {
                      if (err) {
                        reject(err);
                      }
                      else {
                        let t = moment.unix(row.last_visit_date / 1000000);
                        browserHistory.push({
                          title:    row.title,
                          utc_time: t.valueOf(),
                          url:      row.url,
                          browser:  browserName
                        });
                      }
                    });
                  db.close(() => {
                    fs.unlink(newDbPath, (err) => {
                      if (err) {
                        return reject(err);
                      }
                    });
                    res();
                  });
                });
              });
            });
          });
        }));
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory);
    });
  });

}

function getMaxthonBasedBrowserRecords (paths, browserName) {
  let browserHistory = [],
      h              = [];
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      resolve(browserHistory);
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {

          let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.db');

          //Assuming the sqlite file is locked so lets make a copy of it
          const originalDB = new sqlite3.Database(paths[i]);
          originalDB.serialize(() => {
            // This has to be called to merge .db-wall, the in memory db, to disk so we can access the history when
            // safari is open
            originalDB.run('PRAGMA wal_checkpoint(FULL)');
            originalDB.close(() => {
              let readStream  = fs.createReadStream(paths[i]),
                  writeStream = fs.createWriteStream(newDbPath),
                  stream      = readStream.pipe(writeStream);

              stream.on('finish', function () {
                const db = new sqlite3.Database(newDbPath);
                db.serialize(() => {
                  db.run('PRAGMA wal_checkpoint(FULL)');
                  db.each(
                    'SELECT `zlastvisittime`, `zhost`, `ztitle`, `zurl` FROM   zmxhistoryentry WHERE  Datetime (`zlastvisittime` + 978307200, \'unixepoch\') >= Datetime(\'now\', \'-5 minutes\')',
                    function (err, row) {
                      if (err) {
                        reject(err);
                      }
                      else {
                        let t = moment.unix(Math.floor(row.ZLASTVISITTIME + 978307200));
                        browserHistory.push(
                          {
                            title:    row.ZTITLE,
                            utc_time: t.valueOf(),
                            url:      row.ZURL,
                            browser:  browserName
                          });
                      }
                    });

                  db.close(() => {
                    fs.unlink(newDbPath, (err) => {
                      if (err) {
                        return reject(err);
                      }
                    });
                    res();
                  });
                });
              });
            });

          });
          //fs.createWriteStream(newWallDbPath);

        }));
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory);
    });
  });
}

function getSafariBasedBrowserRecords (paths, browserName) {
  let browserHistory = [],
      h              = [];
  return new Promise((resolve, reject) => {
    if (!paths || paths.length === 0) {
      resolve(browserHistory);
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        h.push(new Promise(res => {

          let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.db');

          //Assuming the sqlite file is locked so lets make a copy of it
          const originalDB = new sqlite3.Database(paths[i]);
          originalDB.serialize(() => {
            // This has to be called to merge .db-wall, the in memory db, to disk so we can access the history when
            // safari is open
            originalDB.run('PRAGMA wal_checkpoint(FULL)');
            originalDB.close(() => {
              let readStream  = fs.createReadStream(paths[i]),
                  writeStream = fs.createWriteStream(newDbPath),
                  stream      = readStream.pipe(writeStream);

              stream.on('finish', function () {
                const db = new sqlite3.Database(newDbPath);
                db.serialize(() => {
                  db.run('PRAGMA wal_checkpoint(FULL)');
                  db.each(
                    'SELECT i.id, i.url, v.title, v.visit_time FROM history_items i INNER JOIN history_visits v on i.id = v.history_item WHERE DATETIME (v.visit_time + 978307200, \'unixepoch\')  >= DATETIME(\'now\', \'-5 minutes\')',
                    function (err, row) {
                      if (err) {
                        reject(err);
                      }
                      else {
                        let t = moment.unix(Math.floor(row.visit_time + 978307200));
                        browserHistory.push(
                          {
                            title:    row.title,
                            utc_time: t.valueOf(),
                            url:      row.url,
                            browser:  browserName
                          });
                      }
                    });

                  db.close(() => {
                    fs.unlink(newDbPath, (err) => {
                      if (err) {
                        return reject(err);
                      }
                    });
                    res();
                  });
                });
              });
            });

          });
          //fs.createWriteStream(newWallDbPath);

        }));
      }
    }
    Promise.all(h).then(() => {
      resolve(browserHistory);
    });
  });
}

function getMicrosoftEdgePath (microsoftEdgePath) {
  return new Promise(function (resolve, reject) {
    fs.readdir(microsoftEdgePath, function (err, files) {
      if (err) {
        resolve(null);
        return;
      }
      for (let i = 0; i < files.length; i++) {
        if (files[i].indexOf('Microsoft.MicrosoftEdge') !== -1) {
          microsoftEdgePath = path.join(
            microsoftEdgePath, files[i], 'AC', 'MicrosoftEdge', 'User', 'Default', 'DataStore', 'Data',
            'nouser1');
          break;
        }
      }
      fs.readdir(microsoftEdgePath, function (err2, files2) {
        if (err) {
          resolve(null);
        }
        //console.log(path.join(microsoftEdgePath, files2[0], "DBStore", "spartan.edb"));
        resolve(path.join(microsoftEdgePath, files2[0], 'DBStore', 'spartan.edb'));
      });
    });
  });
}

function getWindowsBrowserHistory (driveLetter, user) {
  records = [];
  return new Promise(function (resolve, reject) {
    let basePath = path.join(driveLetter, 'Users', user, 'AppData');
    let paths    = {
      chrome:    path.join(basePath, 'Local', 'Google', 'Chrome'),
      firefox:   path.join(basePath, 'Roaming', 'Mozilla', 'Firefox'),
      opera:     path.join(basePath, 'Roaming', 'Opera Software'),
      ie:        path.join(basePath, 'Local', 'Microsoft', 'Windows', 'History', 'History.IE5'),
      edge:      path.join(basePath, 'Local', 'Packages'),
      torch:     path.join(basePath, 'Local', 'Torch', 'User Data'),
      seamonkey: path.join(basePath, 'Roaming', 'Mozilla', 'SeaMonkey')
    };
    let getPaths = [
      findPaths(paths.firefox, FIREFOX).then(function (foundPaths) {
        paths.firefox = foundPaths;
      }),
      findPaths(paths.chrome, CHROME).then(function (foundPaths) {
        paths.chrome = foundPaths;
      }),
      findPaths(paths.seamonkey, SEAMONKEY).then(function (foundPaths) {
        paths.seamonkey = foundPaths;
      }),
      findPaths(paths.opera, OPERA).then(function (foundPaths) {
        paths.opera = foundPaths;
      }),
      findPaths(paths.torch, TORCH).then(function (foundPaths) {
        paths.torch = foundPaths;
      }),
      getMicrosoftEdgePath(paths.edge).then(function (foundPaths) {
        paths.edge = foundPaths;
      })
    ];

    Promise.all(getPaths).then(function (values) {
      let getRecords = [
        getBrowserHistory(paths.firefox, FIREFOX),
        getBrowserHistory(paths.seamonkey, SEAMONKEY),
        getBrowserHistory(paths.chrome, CHROME),
        getBrowserHistory(paths.opera, OPERA),
        getBrowserHistory(paths.torch, TORCH),

      ];
      Promise.all(getRecords).then(function (browserRecords) {
        resolve(records);
      }).catch(function (dbReadError) {
        reject(dbReadError);
      });
    }).catch(function (err) {
      reject(err);
    });
  });
}

function getMacBrowserHistory (homeDirectory, user) {
  records = [];
  return new Promise(function (resolve, reject) {

    let paths    = {
      chrome:    path.join(homeDirectory, 'Library', 'Application Support', 'Google', 'Chrome'),
      firefox:   path.join(homeDirectory, 'Library', 'Application Support', 'Firefox'),
      safari:    path.join(homeDirectory, 'Library', 'Safari'),
      opera:     path.join(homeDirectory, 'Library', 'Application Support', 'com.operasoftware.Opera'),
      maxthon:   path.join(
        homeDirectory, 'Library', 'Application Support', 'com.maxthon.mac.Maxthon'),
      vivaldi:   path.join(homeDirectory, 'Library', 'Application Support', 'Vivaldi', 'Default'),
      seamonkey: path.join(homeDirectory, 'Library', 'Application Support', 'SeaMonkey', 'Profiles')
    };
    let getPaths = [
      findPaths(paths.vivaldi, VIVALDI).then(function (foundPath) {
        paths.vivaldi = foundPath;
      }),
      findPaths(paths.firefox, FIREFOX).then(function (foundPath) {
        paths.firefox = foundPath;
      }),
      findPaths(paths.opera, OPERA).then(function (foundPath) {
        paths.opera = foundPath;
      }),
      findPaths(paths.chrome, CHROME).then(function (foundPath) {
        paths.chrome = foundPath;
      }),
      findPaths(paths.safari, SAFARI).then(function (foundPath) {
        paths.safari = foundPath;
      }),
      findPaths(paths.seamonkey, SEAMONKEY).then(function (foundPath) {
        paths.seamonkey = foundPath;
      }),
      findPaths(paths.maxthon, MAXTHON).then(function (foundPath) {
        paths.maxthon = foundPath;
      })
    ];
    Promise.all(getPaths).then(function (values) {
      let getRecords = [
        getBrowserHistory(paths.firefox, FIREFOX),
        getBrowserHistory(paths.chrome, CHROME),
        getBrowserHistory(paths.opera, OPERA),
        getBrowserHistory(paths.safari, SAFARI),
        getBrowserHistory(paths.vivaldi, VIVALDI),
        getBrowserHistory(paths.seamonkey, SEAMONKEY),
        getBrowserHistory(paths.maxthon, MAXTHON)

      ];
      Promise.all(getRecords).then(function () {
        resolve(records);
      }).catch(function (dbReadError) {
        reject(dbReadError);
      });
    }).catch(function (err) {
      reject(err);
    });
  });
}

function getHistory () {
  return new Promise(function (resolve, reject) {
    if (process.env.OS === 'Windows_NT') {
      getWindowsBrowserHistory(process.env.HOMEDRIVE, process.env.USERNAME).then(function (browserHistory) {
        resolve(browserHistory);
      }).catch(function (err) {
        reject(err);
      });
    }
    else {
      getMacBrowserHistory(process.env.HOME, process.env.USER).then(function (browserHistory) {
        resolve(browserHistory);
      }).catch(function (err) {
        reject(err);
      });
    }
  });

}

module.exports = getHistory;

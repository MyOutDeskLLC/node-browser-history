const path    = require('path'),
      fs      = require('fs'),
      sqlite3 = require('sqlite3').verbose(),
      uuidV4  = require('uuid/v4'),
      moment  = require('moment');
var records   = [];

/**
 * Find all files recursively in specific folder with specific extension, e.g:
 * findFilesInDir('./project/src', '.html') ==> ['./project/src/a.html','./project/src/build/index.html']
 * @param  {String} startPath    Path relative to this file or other file which requires this files
 * @param  {String} filter       Extension name, e.g: '.html'
 * @param regExp
 * @return {Array}               Result files with path string in an array
 */
function findFilesInDir (startPath, filter, regExp = new RegExp('.*')) {

  var results = [];

  if (!fs.existsSync(startPath)) {
    console.log('no dir ', startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat     = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, filter, regExp)); //recurse
    }
    else if (filename.indexOf(filter) >= 0 && regExp.test(filename)) {
      console.log('-- found: ', filename);
      results.push(filename);
    }
  }
  return results;
}

function Record (title, dateVisited, url, browserName) {
  this.title    = title;
  this.utc_time = dateVisited;
  this.url      = url;
  this.browser  = browserName;
}

function getFireFoxHistory (paths = [], browserName) {
  return new Promise(function (resolve, reject) {
    getMozillaRecordsFromBrowser(paths, browserName).then(foundRecords => {
      records = records.concat(foundRecords);
      resolve(records);
    }, error => {
      reject(error);
    });
  });
}

function getStandardRecordsFromBrowser (paths, browserName) {
  let browserHistory = [];
  return new Promise((resolve, reject) => {
    if (paths.length === 0) {
      resolve(browserHistory);
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite');

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
                  //console.log(t);
                  browserHistory.push(
                    {
                      title:    row.title,
                      utc_time: t.valueOf(),
                      url:      row.url,
                      browser:  browserName
                    });
                }
              });
          });

          db.close(() => {
            fs.unlink(newDbPath, (err) => {
              if (err) {
                return reject(err);
              }
            });
            if (i === paths.length - 1) {
              resolve(browserHistory);
            }
          });
        });
      }
    }
  });
}

function getMozillaRecordsFromBrowser (paths, browserName) {
  let browserHistory = [];
  return new Promise((resolve, reject) => {

    if (paths.length === 0) {
      resolve(browserHistory);
    }
    for (let i = 0; i < paths.length; i++) {
      if (paths[i] || paths[i] !== '') {
        let newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite');

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
          });
          db.close(function () {
            fs.unlink(newDbPath, function (err) {
              if (err) {
                return reject(err);
              }
            });
            if (i === paths.length - 1) {
              resolve(browserHistory);
            }
          });
        });
      }
    }
  });

}

function getStandardHistory (paths = [], browserName) {
  return new Promise((resolve, reject) => {
    getStandardRecordsFromBrowser(paths, browserName).then(foundRecords => {
      records = records.concat(foundRecords);
      resolve(records);
    }, error => {
      reject(error);
    });
  });
}

function getSafariHistory (dbPath, browserName) {
  return new Promise(function (resolve, reject) {
    if (!dbPath || dbPath === '') {
      return resolve(records);
    }
    var newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite');

    //Assuming the sqlite file is locked so lets make a copy of it
    var readStream  = fs.createReadStream(dbPath),
        writeStream = fs.createWriteStream(newDbPath),
        stream      = readStream.pipe(writeStream);

    stream.on('finish', function () {
      const db = new sqlite3.Database(newDbPath);
      db.serialize(function () {
        db.each(
          'SELECT i.id, i.url, v.title, v.visit_time FROM history_items i INNER JOIN history_visits v on i.id = v.id WHERE DATETIME (v.visit_time + (strftime(\'%s\', \'2001-01-01 00:00:00\')), \'unixepoch\')  >= DATETIME(\'now\', \'-5 minutes\')',
          function (err, row) {
            if (err) {
              reject(err);
            }
            else {
              records.push({
                title:    row.title,
                utc_time: row.visit_time,
                url:      row.url,
                browser:  browserName
              });
            }
          });
      });

      db.close(function () {
        fs.unlink(newDbPath, function (err) {
          if (err) {
            return reject(err);
          }
          return resolve(records);
        });
      });
    });
  });
}

function findPaths (path, browserName) {
  return new Promise(function (resolve, reject) {
    switch (browserName) {
      case 'Firefox':
        resolve(findFilesInDir(path, 'places.sqlite'));
        break;
      case 'Chrome':
        resolve(findFilesInDir(path, 'History', /History$/));
        break;
      case 'Torch':
        resolve(findFilesInDir(path, 'History', /History$/));
        break;
      case 'Opera':
        resolve(findFilesInDir(path, 'History', /History$/));
        break;
      case 'Seamonkey':
        resolve(findFilesInDir(path, '.sqlite'));
        break;
    }
  });
}

function getMicrosoftEdgePath (microsoftEdgePath) {
  return new Promise(function (resolve, reject) {
    fs.readdir(microsoftEdgePath, function (err, files) {
      if (err) {
        resolve(null);
        return;
      }
      for (var i = 0; i < files.length; i++) {
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
    var basePath = path.join(driveLetter, 'Users', user, 'AppData');
    var browsers = {
      chrome:    path.join(basePath, 'Local', 'Google', 'Chrome'),
      firefox:   path.join(basePath, 'Roaming', 'Mozilla', 'Firefox'),
      opera:     path.join(basePath, 'Roaming', 'Opera Software'),
      ie:        path.join(basePath, 'Local', 'Microsoft', 'Windows', 'History', 'History.IE5'),
      edge:      path.join(basePath, 'Local', 'Packages'),
      torch:     path.join(basePath, 'Local', 'Torch', 'User Data'),
      seamonkey: path.join(basePath, 'Roaming', 'Mozilla', 'SeaMonkey')
    };
    var getPaths = [
      findPaths(browsers.firefox, 'Firefox').then(function (foundPaths) {
        browsers.firefox = foundPaths;
      }),
      findPaths(browsers.chrome, 'Chrome').then(function (foundPaths) {
        browsers.chrome = foundPaths;
      }),
      findPaths(browsers.seamonkey, 'Seamonkey').then(function (foundPaths) {
        browsers.seamonkey = foundPaths;
      }),
      findPaths(browsers.opera, 'Opera').then(function (foundPaths) {
        browsers.opera = foundPaths;
      }),
      findPaths(browsers.torch, 'Torch').then(function (foundPaths) {
        browsers.torch = foundPaths;
      }),
      getMicrosoftEdgePath(browsers.edge).then(function (foundPaths) {
        browsers.edge = foundPaths;
      })
    ];

    Promise.all(getPaths).then(function (values) {
      var getRecords = [
        getFireFoxHistory(browsers.firefox, 'Mozilla Firefox'),
        getFireFoxHistory(browsers.seamonkey, 'SeaMonkey'),
        getStandardHistory(browsers.chrome, 'Google Chrome'),
        getStandardHistory(browsers.opera, 'Opera'),
        getStandardHistory(browsers.torch, 'Torch')
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

    var browsers = {
      chrome:    path.join(
        homeDirectory, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'History'),
      firefox:   path.join(homeDirectory, 'Library', 'Application Support', 'Firefox', 'Profiles'),
      safari:    path.join(homeDirectory, 'Library', 'Safari', 'History.db'),
      opera:     path.join(homeDirectory, 'Library', 'Application Support', 'com.operasoftware.Opera', 'History'),
      vivaldi:   path.join(homeDirectory, 'Library', 'Application Support', 'Vivaldi', 'Default', 'History'),
      seamonkey: path.join(homeDirectory, 'Library', 'Application Support', 'SeaMonkey', 'Profiles')
    };
    var getPaths = [
      findPaths(browsers.firefox, user).then(function (foundPath) {
        browsers.firefox = foundPath;
      }),
      findPaths(browsers.seamonkey, user).then(function (foundPath) {
        browsers.seamonkey = foundPath;
      })
    ];
    Promise.all(getPaths).then(function (values) {
      for (var browser in browsers) {
        if (!fs.existsSync(browsers[browser])) {
          browsers[browser] = null;
        }
      }
      var getRecords = [
        getFireFoxHistory(browsers.firefox, 'Mozilla Firefox'),
        getStandardHistory(browsers.chrome, 'Google Chrome'),
        getStandardHistory(browsers.opera, 'Opera'),
        getSafariHistory(browsers.safari, 'Safari'),
        getStandardHistory(browsers.vivaldi, 'Vivaldi'),
        getFireFoxHistory(browsers.seamonkey, 'SeaMonkey')

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

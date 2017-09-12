const path    = require('path'),
      fs      = require('fs'),
      sqlite3 = require('sqlite3').verbose(),
      uuidV4  = require('uuid/v4'),
      moment  = require('moment');
var records   = [];

function Record (title, dateVisited, url, browserName) {
  this.title    = title;
  this.utc_time = dateVisited;
  this.url      = url;
  this.browser  = browserName;
}

function getFireFoxHistory (firefoxPath, browserName) {
  return new Promise(function (resolve, reject) {
    if (!firefoxPath || firefoxPath === '') {
      return resolve(records);
    }
    var newDbPath = path.join(process.env.TMP ? process.env.TMP : process.env.TMPDIR, uuidV4() + '.sqlite');

    //Assuming the sqlite file is locked so lets make a copy of it
    var readStream  = fs.createReadStream(firefoxPath),
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
              let t = moment.unix(row.last_visit_date/1000000);
              records.push({
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
          return resolve(records);
        });
      });
    });
  });
}

function getStandardHistory (dbPath, browserName) {
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
          'SELECT title, last_visit_time, url from urls WHERE DATETIME (last_visit_time/1000000 + (strftime(\'%s\', \'1601-01-01\')), \'unixepoch\')  >= DATETIME(\'now\', \'-5 minutes\')',
          function (err, row) {
            if (err) {
              reject(err);
            }
            else {
              let t = moment.unix(row.last_visit_time/1000000 -11644473600);
              //console.log(t);
              records.push({
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
          return resolve(records);
        });
      });
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

function getFirefoxPath (firefoxPath, user) {
  return new Promise(function (resolve, reject) {
    fs.readdir(firefoxPath, function (err, files) {
      if (err) {
        resolve(null);
        return;
      }
      for (var i = 0, j = 0; j < 2; i++) {
        //First iteration of the loop look for something with the users username in it
        if (j === 0 && files[i].indexOf(user) !== -1) {
          resolve(path.join(firefoxPath, files[i], 'places.sqlite'));
          break;
        }
        //Second iteration of the loop look for something with default in it
        else if (j === 1 && files[i].indexOf('default') !== -1) {
          resolve(path.join(firefoxPath, files[i], 'places.sqlite'));
          break;
        }
        if (i === files.length - 1) {
          j++;
          //i is negative one because the loop is post fix incremented so i will be 0 next iteration
          i = -1;
        }
      }
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
      chrome:    path.join(basePath, 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'History'),
      firefox:   path.join(basePath, 'Roaming', 'Mozilla', 'Firefox', 'Profiles'),
      opera:     path.join(basePath, 'Roaming', 'Opera Software', 'Opera Stable', 'History'),
      ie:        path.join(basePath, 'Local', 'Microsoft', 'Windows', 'History', 'History.IE5'),
      edge:      path.join(basePath, 'Local', 'Packages'),
      torch:     path.join(basePath, 'Local', 'Torch', 'User Data', 'Default', 'History'),
      seamonkey: path.join(basePath, 'Roaming', 'Mozilla', 'SeaMonkey', 'Profiles')
    };
    var getPaths = [
      getFirefoxPath(browsers.firefox, user).then(function (foundPath) {
        browsers.firefox = foundPath;
      }),
      getFirefoxPath(browsers.seamonkey, user).then(function (foundPath) {
        browsers.seamonkey = foundPath;
      }),
      getMicrosoftEdgePath(browsers.edge).then(function (foundPath) {
        browsers.edge = foundPath;
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
      getFirefoxPath(browsers.firefox, user).then(function (foundPath) {
        browsers.firefox = foundPath;
      }),
      getFirefoxPath(browsers.seamonkey, user).then(function (foundPath) {
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

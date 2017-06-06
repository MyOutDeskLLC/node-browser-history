"use strict";

const path    = require("path"),
      fs      = require("fs"),
      sqlite3 = require("sqlite3").verbose(),
      uuidV4  = require("uuid/v4");
var records   = [];

function Record(title, dateVisited, url, browserName) {
    this.title        = title;
    this.dateVisisted = dateVisited;
    this.url          = url;
    this.browserName  = browserName;
}

//Date should be ISO standard
function getWindowsBrowserHistory(driveLetter, user) {
    records = [];
    return new Promise(function (resolve, reject) {
        var basePath = path.join(driveLetter, "Users", user, "AppData");
        var browsers = {
            chrome:    path.join(basePath, "Local", "Google", "Chrome", "User Data", "Default", "History"),
            firefox:   path.join(basePath, "Roaming", "Mozilla", "Firefox", "Profiles"),
            opera:     path.join(basePath, "Roaming", "Opera Software", "Opera Stable", "History"),
            ie:        path.join(basePath, "Local", "Microsoft", "Windows", "History", "History.IE5"),
            edge:      path.join(basePath, "Local", "Packages"),
            torch:     "",
            maxthon:   "",
            seamonkey: "",
            avant:     ""
        };
        var getPaths = [
            getFirefoxPath(browsers.firefox, user).then(function (foundPath) {
                browsers.firefox = foundPath;
            }),
            getMicrosoftEdgePath(browsers.edge).then(function (foundPath) {
                browsers.edge = foundPath;
            })
        ];

        Promise.all(getPaths).then(function (values) {
            var getRecords = [
                getFireFoxHistory(browsers.firefox),
                getChromeOperaHistory(browsers.chrome, "Google Chrome"),
                getChromeOperaHistory(browsers.opera, "Opera")
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

function getFireFoxHistory(firefoxPath) {
    return new Promise(function (resolve, reject) {
        var newDbPath = path.join(process.env.TMP, uuidV4() + ".sqlite");

        //Assuming the sqlite file is locked so lets make a copy of it
        var readStream  = fs.createReadStream(firefoxPath),
            writeStream = fs.createWriteStream(newDbPath),
            stream      = readStream.pipe(writeStream);

        stream.on("finish", function () {
            const db          = new sqlite3.Database(newDbPath);
            const browserName = "Mozilla Firefox";
            db.serialize(function () {
                db.each("SELECT title, last_visit_date, url from moz_places", function (err, row) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        records.push(new Record(row.title, row.last_visit_date, row.url, browserName));
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

function getChromeOperaHistory(dbPath, browserName) {
    return new Promise(function (resolve, reject) {
        var newDbPath = path.join(process.env.TMP, uuidV4() + ".sqlite");

        //Assuming the sqlite file is locked so lets make a copy of it
        var readStream  = fs.createReadStream(dbPath),
            writeStream = fs.createWriteStream(newDbPath),
            stream      = readStream.pipe(writeStream);

        stream.on("finish", function () {
            const db = new sqlite3.Database(newDbPath);
            db.serialize(function () {
                db.each("SELECT title, last_visit_time, url from urls", function (err, row) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        records.push(new Record(row.title, row.last_visit_time, row.url, browserName));
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

function getFirefoxPath(firefoxPath, user) {
    return new Promise(function (resolve, reject) {
        fs.readdir(firefoxPath, function (err, files) {
            if (err) {
                reject(err);
                return;
            }
            for (var i = 0, j = 0; j < 2; i++) {
                //First iteration of the loop look for something with the users username in it
                if (j === 0 && files[i].indexOf(user) !== -1) {
                    resolve(path.join(firefoxPath, files[i], "places.sqlite"));
                    break;
                }
                //Second iteration of the loop look for something with default in it
                else if (j === 1 && files[i].indexOf("default") !== -1) {
                    resolve(path.join(firefoxPath, files[i], "places.sqlite"));
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

function getMicrosoftEdgePath(microsoftEdgePath) {
    return new Promise(function (resolve, reject) {
        fs.readdir(microsoftEdgePath, function (err, files) {
            if (err) {
                reject(err);
                return;
            }
            for (var i = 0; i < files.length; i++) {
                if (files[i].indexOf("Microsoft.MicrosoftEdge") !== -1) {
                    microsoftEdgePath = path.join(microsoftEdgePath, files[i], "AC", "MicrosoftEdge", "User", "Default", "DataStore", "Data", "nouser1");
                    break;
                }
            }
            fs.readdir(microsoftEdgePath, function (err2, files2) {
                if (err) {
                    reject(err);
                }
                //console.log(path.join(microsoftEdgePath, files2[0], "DBStore", "spartan.edb"));
                resolve(path.join(microsoftEdgePath, files2[0], "DBStore", "spartan.edb"));
            });
        });
    });
}

var macBrowserHistoryLocations = function (user) {
    this.chrome    = "";
    this.firefox   = "";
    this.safari    = "";
    this.opera     = "";
    this.vivaldi   = "";
    this.seamonkey = "";
    this.omniweb   = "";
};


function getHistory() {
    return new Promise(function (resolve, reject) {

        if (process.env.OS === "Windows_NT") {
            getWindowsBrowserHistory(process.env.HOMEDRIVE, process.env.USERNAME).then(function (browserHistory) {
                resolve(browserHistory);
            }).catch(function (err) {
                reject(err);
            });
        }
        else {
            //mac
            return "NO";
        }
    });

}

module.exports = getHistory;

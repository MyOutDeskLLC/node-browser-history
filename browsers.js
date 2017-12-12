const path = require('path'),
      fs      = require('fs');

const CHROME           = 'Google Chrome',
      FIREFOX          = 'Mozilla Firefox',
      TORCH            = 'Torch',
      OPERA            = 'Opera',
      SEAMONKEY        = 'SeaMonkey',
      VIVALDI          = 'Vivaldi',
      SAFARI           = 'Safari',
      MAXTHON          = 'Maxthon',
      INTERNETEXPLORER = 'Internet Explorer';


let basePath = '',
    paths    = {};

if (process.env.os === 'Windows_NT') {

  basePath = path.join(process.env.HOMEDRIVE, 'Users', process.env.USERNAME, 'AppData');
  paths    = {
    chrome:    path.join(basePath, 'Local', 'Google', 'Chrome'),
    firefox:   path.join(basePath, 'Roaming', 'Mozilla', 'Firefox'),
    opera:     path.join(basePath, 'Roaming', 'Opera Software'),
    ie:        path.join(basePath, 'Local', 'Microsoft', 'Windows', 'History', 'History.IE5'),
    edge:      path.join(basePath, 'Local', 'Packages'),
    torch:     path.join(basePath, 'Local', 'Torch', 'User Data'),
    seamonkey: path.join(basePath, 'Roaming', 'Mozilla', 'SeaMonkey')
  };

}
else {
  let homeDirectory = process.env.HOME;
  paths             = {
    chrome:    path.join(homeDirectory, 'Library', 'Application Support', 'Google', 'Chrome'),
    firefox:   path.join(homeDirectory, 'Library', 'Application Support', 'Firefox'),
    safari:    path.join(homeDirectory, 'Library', 'Safari'),
    opera:     path.join(homeDirectory, 'Library', 'Application Support', 'com.operasoftware.Opera'),
    maxthon:   path.join(homeDirectory, 'Library', 'Application Support', 'com.maxthon.mac.Maxthon'),
    vivaldi:   path.join(homeDirectory, 'Library', 'Application Support', 'Vivaldi', 'Default'),
    seamonkey: path.join(homeDirectory, 'Library', 'Application Support', 'SeaMonkey', 'Profiles')
  };
}

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

module.exports = {
  paths,
  findPaths,
  CHROME,
  FIREFOX,
  TORCH,
  OPERA,
  SEAMONKEY,
  VIVALDI,
  SAFARI,
  MAXTHON,
  INTERNETEXPLORER
};


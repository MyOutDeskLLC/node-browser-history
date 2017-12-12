const path = require('path'),
      fs   = require('fs');

const CHROME           = 'Google Chrome',
      FIREFOX          = 'Mozilla Firefox',
      TORCH            = 'Torch',
      OPERA            = 'Opera',
      SEAMONKEY        = 'SeaMonkey',
      VIVALDI          = 'Vivaldi',
      SAFARI           = 'Safari',
      MAXTHON          = 'Maxthon',
      INTERNETEXPLORER = 'Internet Explorer';

let paths = {
  chrome:    '',
  firefox:   '',
  opera:     '',
  ie:        '',
  torch:     '',
  seamonkey: '',
  vivaldi:   '',
  maxthon:   '',
  safari:    ''
};

if (process.env.os === 'Windows_NT') {

  let basePath = path.join(process.env.HOMEDRIVE, 'Users', process.env.USERNAME, 'AppData');

  paths.chrome    = path.join(basePath, 'Local', 'Google', 'Chrome');
  paths.firefox   = path.join(basePath, 'Roaming', 'Mozilla', 'Firefox');
  paths.opera     = path.join(basePath, 'Roaming', 'Opera Software');
  paths.ie        = path.join(basePath, 'Local', 'Microsoft', 'Windows', 'History', 'History.IE5');
  paths.edge      = path.join(basePath, 'Local', 'Packages');
  paths.torch     = path.join(basePath, 'Local', 'Torch', 'User Data');
  paths.seamonkey = path.join(basePath, 'Roaming', 'Mozilla', 'SeaMonkey');

}
else {
  let homeDirectory = process.env.HOME;

  paths.chrome    = path.join(homeDirectory, 'Library', 'Application Support', 'Google', 'Chrome');
  paths.firefox   = path.join(homeDirectory, 'Library', 'Application Support', 'Firefox');
  paths.safari    = path.join(homeDirectory, 'Library', 'Safari');
  paths.opera     = path.join(homeDirectory, 'Library', 'Application Support', 'com.operasoftware.Opera');
  paths.maxthon   = path.join(homeDirectory, 'Library', 'Application Support', 'com.maxthon.mac.Maxthon');
  paths.vivaldi   = path.join(homeDirectory, 'Library', 'Application Support', 'Vivaldi', 'Default');
  paths.seamonkey = path.join(homeDirectory, 'Library', 'Application Support', 'SeaMonkey', 'Profiles');
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
  return new Promise(resolve=> {
    switch (browserName) {
      case FIREFOX:
      case SEAMONKEY:
        resolve(findFilesInDir(path, '.sqlite', /places.sqlite$/));
        break;
      case CHROME:
      case TORCH:
      case OPERA:
        resolve(findFilesInDir(path, 'History', /History$/));
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
  findPaths,
  paths,
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


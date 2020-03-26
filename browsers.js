const path = require('path'),
      fs   = require('fs')

const CHROME           = 'Google Chrome',
      FIREFOX          = 'Mozilla Firefox',
      TORCH            = 'Torch',
      OPERA            = 'Opera',
      SEAMONKEY        = 'SeaMonkey',
      VIVALDI          = 'Vivaldi',
      SAFARI           = 'Safari',
      MAXTHON          = 'Maxthon',
      INTERNETEXPLORER = 'Internet Explorer',
      BRAVE            = 'Brave'

let browserDbLocations = {
  chrome:    '',
  firefox:   '',
  opera:     '',
  ie:        '',
  torch:     '',
  seamonkey: '',
  vivaldi:   '',
  maxthon:   '',
  safari:    '',
  brave:     ''
}

let defaultPaths = {
  chrome:    '',
  firefox:   '',
  opera:     '',
  ie:        '',
  torch:     '',
  seamonkey: '',
  vivaldi:   '',
  maxthon:   '',
  safari:    '',
  brave:     ''
}

if (process.platform !== 'darwin') {

  let basePath = path.join(process.env.HOMEDRIVE, 'Users', process.env.USERNAME, 'AppData')

  defaultPaths.chrome    = path.join(basePath, 'Local', 'Google', 'Chrome')
  defaultPaths.firefox   = path.join(basePath, 'Roaming', 'Mozilla', 'Firefox')
  defaultPaths.opera     = path.join(basePath, 'Roaming', 'Opera Software')
  defaultPaths.ie        = path.join(basePath, 'Local', 'Microsoft', 'Windows', 'History', 'History.IE5')
  defaultPaths.edge      = path.join(basePath, 'Local', 'Packages')
  defaultPaths.torch     = path.join(basePath, 'Local', 'Torch', 'User Data')
  defaultPaths.seamonkey = path.join(basePath, 'Roaming', 'Mozilla', 'SeaMonkey')
  defaultPaths.brave     = path.join(basePath, 'Local', 'BraveSoftware', 'Brave-Browser', 'User Data')
}
else {
  let homeDirectory = process.env.HOME

  defaultPaths.chrome    = path.join(homeDirectory, 'Library', 'Application Support', 'Google', 'Chrome')
  defaultPaths.firefox   = path.join(homeDirectory, 'Library', 'Application Support', 'Firefox')
  defaultPaths.safari    = path.join(homeDirectory, 'Library', 'Safari')
  defaultPaths.opera     = path.join(homeDirectory, 'Library', 'Application Support', 'com.operasoftware.Opera')
  defaultPaths.maxthon   = path.join(homeDirectory, 'Library', 'Application Support', 'com.maxthon.mac.Maxthon')
  defaultPaths.vivaldi   = path.join(homeDirectory, 'Library', 'Application Support', 'Vivaldi', 'Default')
  defaultPaths.seamonkey = path.join(homeDirectory, 'Library', 'Application Support', 'SeaMonkey', 'Profiles')
  defaultPaths.brave     = path.join(homeDirectory, 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser')
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

  let results = []

  if (!fs.existsSync(startPath)) {
    //console.log("no dir ", startPath);
    return results
  }

  let files = fs.readdirSync(startPath)
  for (let i = 0; i < files.length; i++) {
    let filename = path.join(startPath, files[i])
    if (!fs.existsSync(filename)) {
      //console.log('file doesn\'t exist ', startPath);
      return results
    }
    let stat = fs.lstatSync(filename)
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, filter, regExp)) //recurse
    }
    else if (filename.indexOf(filter) >= 0 && regExp.test(filename)) {
      //console.log('-- found: ', filename);
      results.push(filename)
    }
  }
  return results
}

/**
 * Finds the path to the browsers DB file.
 * Returns an array of strings, paths, or an empty array
 * @param path
 * @param browserName
 * @returns {Array}
 */
function findPaths (path, browserName) {
    switch (browserName) {
      case FIREFOX:
      case SEAMONKEY:
        return findFilesInDir(path, '.sqlite', /places.sqlite$/)
      case CHROME:
      case TORCH:
      case OPERA:
      case BRAVE:
        return findFilesInDir(path, 'History', /History$/)
      case VIVALDI:
        return findFilesInDir(path, '.sqlite')
      case SAFARI:
        return findFilesInDir(path, '.db', /History.db$/)
      case MAXTHON:
        return findFilesInDir(path, '.dat', /History.dat$/)
      default:
        return []
    }
}

module.exports = {
  findPaths,
  browserDbLocations,
  defaultPaths,
  CHROME,
  FIREFOX,
  TORCH,
  OPERA,
  SEAMONKEY,
  VIVALDI,
  SAFARI,
  MAXTHON,
  INTERNETEXPLORER,
  BRAVE
}


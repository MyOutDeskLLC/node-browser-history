const Path =  require('path')
const fs = require("fs");

const CHROME = "Google Chrome",
    FIREFOX = "Mozilla Firefox",
    TORCH = "Torch",
    OPERA = "Opera",
    SEAMONKEY = "SeaMonkey",
    VIVALDI = "Vivaldi",
    SAFARI = "Safari",
    MAXTHON = "Maxthon",
    EDGE = "Microsoft Edge",
    BRAVE = "Brave",
    AVAST = "AVAST Browser";

let browserDbLocations = {
    chrome: "",
    firefox: "",
    opera: "",
    edge: "",
    torch: "",
    seamonkey: "",
    vivaldi: "",
    maxthon: "",
    safari: "",
    brave: "",
    avast: ""
};

let defaultPaths = {
    chrome: "",
    firefox: "",
    opera: "",
    edge: "",
    torch: "",
    seamonkey: "",
    vivaldi: "",
    maxthon: "",
    safari: "",
    brave: "",
    avast: ""
};

if (process.platform !== "darwin") {

    let basePath = Path.join(process.env.HOMEDRIVE, "Users", process.env.USERNAME, "AppData");

    defaultPaths.chrome = Path.join(basePath, "Local", "Google", "Chrome");
    defaultPaths.avast = Path.join(basePath, "Local", "Google", "AVAST Software");
    defaultPaths.firefox = Path.join(basePath, "Roaming", "Mozilla", "Firefox");
    defaultPaths.opera = Path.join(basePath, "Roaming", "Opera Software");
    defaultPaths.edge = Path.join(basePath, "Local", "Microsoft", "Edge");
    defaultPaths.torch = Path.join(basePath, "Local", "Torch", "User Data");
    defaultPaths.seamonkey = Path.join(basePath, "Roaming", "Mozilla", "SeaMonkey");
    defaultPaths.brave = Path.join(basePath, "Local", "BraveSoftware");

} else {
    let homeDirectory = process.env.HOME;

    defaultPaths.chrome = Path.join(homeDirectory, "Library", "Application Support", "Google", "Chrome");
    defaultPaths.avast = Path.join(homeDirectory, "Library", "Application Support", "AVAST Software", "Browser");
    defaultPaths.firefox = Path.join(homeDirectory, "Library", "Application Support", "Firefox");
    defaultPaths.edge = Path.join(homeDirectory, "Library", "Application Support", "Microsoft Edge");
    // defaultPaths.safari = Path.join(homeDirectory, "Library", "Safari");
    defaultPaths.opera = Path.join(homeDirectory, "Library", "Application Support", "com.operasoftware.Opera");
    defaultPaths.maxthon = Path.join(homeDirectory, "Library", "Application Support", "com.maxthon.mac.Maxthon");
    defaultPaths.vivaldi = Path.join(homeDirectory, "Library", "Application Support", "Vivaldi");
    defaultPaths.seamonkey = Path.join(homeDirectory, "Library", "Application Support", "SeaMonkey", "Profiles");
    defaultPaths.brave = Path.join(homeDirectory, "Library", "Application Support", "BraveSoftware", "Brave-Browser");
}

/**
 * Find all files recursively in specific folder with specific extension, e.g:
 * findFilesInDir('./project/src', '.html') ==> ['./project/src/a.html','./project/src/build/index.html']
 * @param  {String} startPath    Path relative to this file or other file which requires this files
 * @param  {String} filter       Extension name, e.g: '.html'
 * @param targetFile
 * @param depth
 * @return {Array}               Result files with path string in an array
 */
function findFilesInDir(startPath, filter, targetFile, depth = 0) {
    if(depth === 4){
        return [];
    }
    let results = [];
    if (!fs.existsSync(startPath)) {
        //console.log("no dir ", startPath);
        return results;
    }
    let files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        let filename = Path.join(startPath, files[i]);
        if (!fs.existsSync(filename)) {
            // console.log('file doesn\'t exist ', startPath);
            return results;
        }
        let stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            results = results.concat(findFilesInDir(filename, filter, targetFile, depth + 1)); //recurse
        } else if(filename.endsWith(targetFile) === true) {
            console.log('-- found: ', filename);
            results.push(filename);
        }
        /*
        } else if (filename.indexOf(filter) >= 0 && regExp.test(filename)) {
            results.push(filename);
        } else if (filename.endsWith('\\History') === true) {
            // console.log('-- found: ', filename);
            results.push(filename);
        }*/
    }
    return results;
}



/**
 * Finds the path to the browsers DB file.
 * Returns an array of strings, paths, or an empty array
 * @param path
 * @param browserName
 * @returns {Array}
 */
function findPaths(path, browserName) {
    switch (browserName) {
        case FIREFOX:
        case SEAMONKEY:

            return findFilesInDir(path, ".sqlite", Path.sep + 'places.sqlite');
        case CHROME:
        case TORCH:
        case OPERA:
        case BRAVE:
        case VIVALDI:
        case EDGE:
        case AVAST:
            return findFilesInDir(path, "History", Path.sep + 'History');
        case SAFARI:
            return findFilesInDir(path, ".db", Path.sep + 'History.db');
        case MAXTHON:
            return findFilesInDir(path, ".dat", Path.sep + 'History.dat');
        default:
            return [];
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
    BRAVE,
    EDGE,
    AVAST
};


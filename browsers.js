const Path =  require('path')
const fs = require("fs");
const { setupDefaultPaths: setupPaths } = require('./history_paths');

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


let defaultPaths = setupPaths();

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
            continue;
        }
        let stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            results = results.concat(findFilesInDir(filename, filter, targetFile, depth + 1)); //recurse
        } else if(filename.endsWith(targetFile) === true) {
            // console.log('-- found: ', filename);
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


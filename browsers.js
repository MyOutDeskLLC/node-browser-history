const path = require("path");
const fsp = require("fs").promises;
const util = require("util");

const CHROME = "Google Chrome",
    FIREFOX = "Mozilla Firefox",
    TORCH = "Torch",
    OPERA = "Opera",
    SEAMONKEY = "SeaMonkey",
    VIVALDI = "Vivaldi",
    SAFARI = "Safari",
    MAXTHON = "Maxthon",
    EDGE = "Microsoft Edge",
    BRAVE = "Brave";

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
};

if (process.platform !== "darwin") {

    let basePath = path.join(process.env.HOMEDRIVE, "Users", process.env.USERNAME, "AppData");

    defaultPaths.chrome = path.join(basePath, "Local", "Google", "Chrome");
    defaultPaths.firefox = path.join(basePath, "Roaming", "Mozilla", "Firefox");
    defaultPaths.opera = path.join(basePath, "Roaming", "Opera Software");
    defaultPaths.edge = path.join(basePath, "Local", "Microsoft", "Edge");
    defaultPaths.torch = path.join(basePath, "Local", "Torch", "User Data");
    defaultPaths.seamonkey = path.join(basePath, "Roaming", "Mozilla", "SeaMonkey");
    defaultPaths.brave = path.join(basePath, "Local", "BraveSoftware", "Brave-Browser", "Default");

} else {
    let homeDirectory = process.env.HOME;

    defaultPaths.chrome = path.join(homeDirectory, "Library", "Application Support", "Google", "Chrome");
    defaultPaths.firefox = path.join(homeDirectory, "Library", "Application Support", "Firefox");
    defaultPaths.edge = path.join(homeDirectory, "Library", "Application Support", "Microsoft Edge");
    // defaultPaths.safari = path.join(homeDirectory, "Library", "Safari");
    defaultPaths.opera = path.join(homeDirectory, "Library", "Application Support", "com.operasoftware.Opera");
    defaultPaths.maxthon = path.join(homeDirectory, "Library", "Application Support", "com.maxthon.mac.Maxthon");
    defaultPaths.vivaldi = path.join(homeDirectory, "Library", "Application Support", "Vivaldi");
    defaultPaths.seamonkey = path.join(homeDirectory, "Library", "Application Support", "SeaMonkey", "Profiles");
    defaultPaths.brave = path.join(homeDirectory, "Library", "Application Support", "BraveSoftware", "Brave-Browser");
}

/**
 * Find all files recursively in specific folder with specific extension, e.g:
 * findFilesInDir('./project/src', '.html') ==> ['./project/src/a.html','./project/src/build/index.html']
 * @param  {String} startPath    Path relative to this file or other file which requires this files
 * @param  {String} filter       Extension name, e.g: '.html'
 * @param regExp
 */
async function findFilesInDir(startPath, filter, regExp = new RegExp(".*")) {
    let results = [];
    let files = await fsp.readdir(startPath);
    for (let i = 0; i < files.length; i++) {
        let filename = path.join(startPath, files[i]);
        try {
            let stats = await fsp.stat(filename);
            if (stats.isDirectory()) {
                try {
                    results = results.concat((await findFilesInDir(filename, filter, regExp)));
                } catch (error) {
                    console.log(error);
                }
            } else if (filename.indexOf(filter) >= 0 && regExp.test(filename)) {
                console.log("-- found: ", filename);
                results.push(filename);
            }
        } catch (error) {
        }
    }
    return results;
}

/**
 * Finds the path to the browsers DB file.
 * Returns an array of strings, paths, or an empty array
 * @param path
 * @param browserName
 * @returns {Promise}
 */
async function findPaths(path, browserName) {
    switch (browserName) {
        case FIREFOX:
        case SEAMONKEY:
            return findFilesInDir(path, ".sqlite", /places\.sqlite$/);
        case CHROME:
        case TORCH:
        case OPERA:
        case BRAVE:
        case VIVALDI:
        case EDGE:
            return findFilesInDir(path, "History", /History$/);
        case SAFARI:
            return findFilesInDir(path, ".db", /History\.db$/);
        case MAXTHON:
            return findFilesInDir(path, ".dat", /History\.dat$/);
        default:
            return Promise.resolve([]);
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
};


const Path = require('path');

const homeDirectory = process.env.HOME;

function setupForWindows() {
    let defaultPaths = {}

    const appDataDirectory = Path.join(process.env.HOMEDRIVE, "Users", process.env.USERNAME, "AppData");

    defaultPaths.chrome = Path.join(appDataDirectory, "Local", "Google", "Chrome");
    defaultPaths.avast = Path.join(appDataDirectory, "Local", "Google", "AVAST Software");
    defaultPaths.firefox = Path.join(appDataDirectory, "Roaming", "Mozilla", "Firefox");
    defaultPaths.opera = Path.join(appDataDirectory, "Roaming", "Opera Software");
    defaultPaths.edge = Path.join(appDataDirectory, "Local", "Microsoft", "Edge");
    defaultPaths.torch = Path.join(appDataDirectory, "Local", "Torch", "User Data");
    defaultPaths.seamonkey = Path.join(appDataDirectory, "Roaming", "Mozilla", "SeaMonkey");
    defaultPaths.brave = Path.join(appDataDirectory, "Local", "BraveSoftware", "Brave-Browser", "User Data");
    defaultPaths.vivaldi = Path.join(appDataDirectory, "Local", "Vivaldi", "User Data");
    return defaultPaths
}

function setupForMac() {
    let defaultPaths = {}
    defaultPaths.chrome = Path.join(homeDirectory, "Library", "Application Support", "Google", "Chrome");
    defaultPaths.avast = Path.join(homeDirectory, "Library", "Application Support", "AVAST Software", "Browser");
    defaultPaths.firefox = Path.join(homeDirectory, "Library", "Application Support", "Firefox");
    defaultPaths.edge = Path.join(homeDirectory, "Library", "Application Support", "Microsoft Edge");
    defaultPaths.safari = Path.join(homeDirectory, "Library", "Safari");
    defaultPaths.opera = Path.join(homeDirectory, "Library", "Application Support", "com.operasoftware.Opera");
    defaultPaths.maxthon = Path.join(homeDirectory, "Library", "Application Support", "com.maxthon.mac.Maxthon");
    defaultPaths.vivaldi = Path.join(homeDirectory, "Library", "Application Support", "Vivaldi");
    defaultPaths.seamonkey = Path.join(homeDirectory, "Library", "Application Support", "SeaMonkey", "Profiles");
    defaultPaths.brave = Path.join(homeDirectory, "Library", "Application Support", "BraveSoftware", "Brave-Browser");
    return defaultPaths;
}

function setupForLinux() {
    let defaultPaths = {}
    defaultPaths.firefox = Path.join(homeDirectory, ".mozilla", "firefox");
    defaultPaths.chrome = Path.join(homeDirectory, ".config", "google-chrome", "Default");
    return defaultPaths
}

function setupDefaultPaths(defaultPaths) {
    switch (process.platform) {
        case 'darwin':
            return setupForMac(defaultPaths);
        case 'linux':
            return setupForLinux(defaultPaths);
        case 'win32':
            return setupForWindows(defaultPaths);
        default:
            console.error(`Platform ${process.platform} is not supported by node-browser-history`);
    }
}

module.exports = {
    setupDefaultPaths
};

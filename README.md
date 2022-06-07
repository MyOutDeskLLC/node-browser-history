# node-browser-history

This module will gather browser history from common internet browsers. Given a time frame.

## Supported operating systems

* Windows
* Mac
* Linux (only Firefox and Chrome)

## Supported browsers

| Browser         | Windows | Mac | Linux |
| --------------- | ---- | --- | ----- |
| Google Chrome   | ✅    | ✅  | ✅    |
| Maxthon         | -    | ✅  | -     |
| Microsoft Edge  | ✅    | ✅  | -     |
| Mozilla Firefox | ✅    | ✅  | ✅    |
| Opera           | ✅    | ✅  | -     |
| Seamonkey       | ✅    | ✅  | -     |
| Torch           | ✅    | -   | -     |
| Vivaldi         | ✅      | ✅  | -     |
| Brave           | ✅    | ✅  | -     |
| Avast Browser   | ✅    | ✅  | -     |


# How to Install

> npm install node-browser-history

**OR**

> yarn install node-browser-history

# Notes

* You may experience slow downs when dealing with browser that have a larger browser history.

# How to Use

```javascript
const BrowserHistory = require('node-browser-history');


//Only All Support Browser History

/**
 * Gets the history for the Specified browsers and time in minutes.
 * Returns an array of browser records.
 * @param historyTimeLength | Integer
 * @returns {Promise<array>}
 */
getAllHistory(10).then(function (history) {
  console.log(history);
});



/**
 * Gets Firefox history
 * @param historyTimeLength
 * @returns {Promise<array>}
 */
getFirefoxHistory(10).then(function (history) {
  console.log(history);
});


/**
 * Gets Seamonkey History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getSeaMonkeyHistory(10).then(function (history) {
  console.log(history);
});


/**
 * Gets Chrome History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getChromeHistory(10).then(function (history) {
  console.log(history);
});


/**
 * Get Opera History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getOperaHistory(10).then(function (history) {
  console.log(history);
});


/**
 * Get Torch History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getTorchHistory(10).then(function (history) {
  console.log(history);
});


/**
 * Get Brave History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getBraveHistory(10).then(function (history) {
  console.log(history);
});


/**
 * Get Maxthon History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getMaxthonHistory(10).then(function (history) {
  console.log(history);
});

/**
 * Get Vivaldi History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getVivaldiHistory(10).then(function (history) {
  console.log(history);
});


/**
 * Get Internet Explorer History
 * @param historyTimeLength time is in minutes
 * @returns {Promise<array>}
 */
getIEHistory(10).then(function (history) {
  console.log(history);
});
```

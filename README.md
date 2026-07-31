# :information_source: Maintenance Status

This project is in **low-activity maintenance**. It is stable and still in use, but no new features are planned.

## :memo: Details

We keep the library working: dependency and security updates get applied, and pull requests are reviewed and merged. What we don't do is active feature development or fast turnaround on issues, so expect responses to take a while.

Contributions are welcome — bug fixes and browser support updates especially.

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
| Maxthon         | ❌    | ✅  | ❌     |
| Microsoft Edge  | ✅    | ✅  | ❌     |
| Mozilla Firefox | ✅    | ✅  | ✅    |
| Opera           | ✅    | ✅  | ❌     |
| Seamonkey       | ✅    | ✅  | ❌     |
| Torch           | ✅    | ❌   | ❌     |
| Vivaldi         | ✅      | ✅  | ❌     |
| Brave           | ✅    | ✅  | ❌     |
| Avast Browser   | ✅    | ✅  | ❌     |


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

```

# node-browser-history

This module will gather browser history from common internet browsers. Given a time frame.
> Operating Systems Supported

* Windows
* Mac

> Browsers Supported

![Chrome](https://i.imgur.com/SgiX8bb.png)
![Maxthon](https://i.imgur.com/D2rD9CV.png)
![FireFox](https://i.imgur.com/Xy4ZZTT.png)
![Opera](https://i.imgur.com/VVYCBQW.png)
![SeaMonkey](https://i.imgur.com/OgTBYE8.png)
![Torch](https://i.imgur.com/9xB5ReO.png)
![Vivaldi](https://i.imgur.com/GTy9hXK.png)
![Brave](https://i.imgur.com/SEWgLIJ.png)
![Microsoft Edge](https://i.imgur.com/Iyd33UT.png)

* Google Chrome
* Maxthon (Mac Only)
* Microsoft Edge
* Mozilla Firefox
* Opera
* Seamonkey
* Torch (Windows Only)
* Vivaldi (Mac Only)
* Brave

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

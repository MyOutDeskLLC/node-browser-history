# node-browser-history

This module will gather browser history from common internet browsers. Only for the last 5 minutes.
> Operating Systems Supported

* Windows (Partially Complete)
* Mac

> Browsers Supported

![Chrome](https://i.imgur.com/SgiX8bb.png)
![Maxthon](https://i.imgur.com/D2rD9CV.png)
![FireFox](https://i.imgur.com/Xy4ZZTT.png)
![Opera](https://i.imgur.com/VVYCBQW.png)
![Safari](https://i.imgur.com/AZYxynY.png)
![SeaMonkey](https://i.imgur.com/OgTBYE8.png)
![Torch](https://i.imgur.com/9xB5ReO.png)
![Vivaldi](https://i.imgur.com/GTy9hXK.png)

* Google Chrome
* Internet Explorer (Windows Only)
* Maxthon (Mac Only)
* Microsoft Edge (Coming Soon)
* Mozilla Firefox
* Opera
* Safari (Mac Only)
* Seamonkey
* Torch (Windows Only)
* Vivaldi (Mac Only)

# How to Install

> npm install node-browser-history

**OR**

> yarn install node-browser-history

# How to Use

``` 
const BrowserHistory = require('node-browser-history');


//Only All Support Browser History

getAllHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Firefox History

getFirefoxHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Firefox History

getSeaMonkeyHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Chrome History

getChromeHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Opera History

getOperaHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Torch History

getTorchHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Safari History (Mac Only)

getSafariHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Maxthon History

getMaxthonHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Vivaldi History

getVivaldiHistory().then(function (history) {
  console.log(history);
});


//Only Retrieve Internet Explorer History

getIEHistory().then(function (history) {
  console.log(history);
});
```
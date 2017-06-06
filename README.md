# node-browser-history

This module will gather browser history from common internet browsers.
> Operating Systems Supported

* Windows (Partially Complete)
* Mac

> Browsers Supported

* Google Chrome
* Internet Explorer (Coming Soon)
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
const BrowserHistory = require("node-browser-history");

getHistory().then(function (history) {
    console.log(history);
   });
```
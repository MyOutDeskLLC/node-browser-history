# node-browser-history

This module will gather browser history from common internet browsers.
> Operating Systems Supported

* Windows (Partially Complete)
* Mac

> Browsers Supported

* Google Chrome
* Mozilla Firefox
* Opera
* Safari (Mac Only)
* Seamonkey (Mac Only)
* Vivaldi (Mac Only)
* Internet Explorer (Coming Soon)
* Microsoft Edge (Coming Soon)
* Torch (Coming Soon)
* Maxthon (Coming Soon)
* Avant (Coming Soon)

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
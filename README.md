# npm-node-history

This module will gather browser history from common internet browsers.
> Operating Systems Supported

* Windows
* Mac (Coming Soon)

> Browsers Supported

* Google Chrome
* Mozilla Firefox
* Opera
* Safari (Coming Soon)
* Internet Explorer (Coming Soon)
* Microsoft Edge (Coming Soon)
* Torch (Coming Soon)
* Maxthon (Coming Soon)
* Seamonkey (Coming Soon)
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
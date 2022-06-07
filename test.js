let history = require("./index");

function testGetAllHistory() {
    console.log("***** RUNNING GET ALL HISTORY TEST *****");
    return new Promise(res => {
        history.getAllHistory(60).then(browsers => {
            history = []
            for(let browser of browsers){
                for(let record of browser){
                    history.push(record)
                }
            }
            console.log("PASS GET ALL HISTORY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAILED TO GET ALL HISTORY *****");
            return Promise.reject(error);
        });
    });
}

function testGetChromeOnly() {
    console.log("***** RUNNING GET CHROME ONLY *****");
    return new Promise(res => {
        history.getChromeHistory(180).then(history => {
            console.log("PASS GET CHROME ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET CHROME ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testFireFoxOnly() {
    console.log("***** RUNNING GET FIREFOX ONLY *****");
    return new Promise(res => {
        history.getFirefoxHistory(180).then(history => {
            console.log("PASS GET FIREFOX ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET FIREFOX ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testSafariOnly() {
    console.log("***** RUNNING GET SAFARI ONLY *****");
    return new Promise(res => {
        history.getSafariHistory(60).then(history => {
            console.log("PASS GET SAFARI ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET SAFARI ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testAvastOnly() {
    console.log("***** RUNNING GET AVAST ONLY *****");
    return new Promise(res => {
        history.getAvastHistory(180).then(history => {
            console.log(history);
            console.log("PASS AVAST ONLY");
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET AVAST ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testOperaOnly() {
    console.log("***** RUNNING GET OPERA ONLY *****");
    return new Promise(res => {
        history.getOperaHistory(60).then(history => {
            console.log("PASS GET OPERA ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET OPERA ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testSeaMonkeyOnly() {
    console.log("***** RUNNING GET SEAMONKEY ONLY *****");
    return new Promise(res => {
        history.getSeaMonkeyHistory(60).then(history => {
            console.log("PASS GET SEAMONKEY ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET SEAMONKEY ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testVivaldiOnly() {
    console.log("***** RUNNING GET VIVALDI ONLY *****");
    return new Promise(res => {
        history.getVivaldiHistory(60).then(history => {
            console.log("PASS GET VIVALDI ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET VIVALDI ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testMaxthonOnly() {
    console.log("***** RUNNING GET MAXTHON ONLY *****");
    return new Promise(res => {
        history.getMaxthonHistory(60).then(history => {
            console.log("PASS GET MAXTHON ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET MAXTHON ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testInternetExplorerOnly() {
    if (process.platform !== "win32") {
        console.log("Internet explorer not supported on Mac");
        return;
    }
    console.log("***** RUNNING GET INTERNET EXPLORER ONLY *****");
    return new Promise(res => {
        history.getIEHistory(60).then(history => {
            console.log("PASS GET INTERNET EXPLORER ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET INTERNET EXPLORER ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testTorchOnly() {
    console.log("***** RUNNING GET TORCH ONLY *****");
    return new Promise(res => {
        history.getTorchHistory(60).then(history => {
            console.log("PASS GET TORCH ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET TORCH ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testBraveOnly() {
    console.log("***** RUNNING GET BRAVE ONLY *****");
    return new Promise(res => {
        history.getBraveHistory(180).then(history => {
            console.log("PASS GET BRAVE ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET BRAVE ONLY *****");
            return Promise.reject(error);
        });
    });
}

function testMicrosoftEdgeOnly() {
    console.log("***** RUNNING GET MICROSOFT EDGE ONLY *****");
    return new Promise(res => {
        history.getMicrosoftEdge(180).then(history => {
            console.log("PASS GET MICROSOFT EDGE ONLY");
            console.log(history);
            res(history);
        }).catch(error => {
            console.log("***** FAIL TO GET MICROSOFT EDGE ONLY *****");
            return Promise.reject(error);
        });
    });
}


let tests = [
    // testGetChromeOnly(),
    // testFireFoxOnly(),
    // testBraveOnly(),
    // testOperaOnly(),
    // testSeaMonkeyOnly(),
    // testMaxthonOnly(),
    // testVivaldiOnly(),
    // testAvastOnly(),
    // testMicrosoftEdgeOnly(),
    // testSafariOnly(),
    // testTorchOnly(),
    testGetAllHistory(),
];

Promise.all(tests).then(() => {
    console.log("PASSING ALL TESTS");
    process.exit(0);
}).catch(error => {
    console.log('kasjdlasdjlaskdjalskdj')
    console.log(error)
    process.exit(error);
});

// testGetAllHistory()

// setInterval(()=>{
//   testGetAllHistory();
// },2000)





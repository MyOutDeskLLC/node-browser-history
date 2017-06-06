var getHistory = require("./index");


function singleRun() {
    getHistory().then(function (stuff) {
        console.log("Pass Single Run Test");
    }).catch(function (someError) {
        console.log("Fail Single Run Test");
        console.error(someError);
    });
}

function concurrencyLockTest() {
    var pass = true;
    for (var x = 0; x < 100; x++) {
        getHistory().then(function (stuff) {
        }).catch(function (someError) {
            pass = false;
            console.log("Fail Concurrency Lock Test");
            console.error(someError);
        });
    }
    if (pass) {
        console.log("Pass Concurrency Lock Test");
    }
}

singleRun();
concurrencyLockTest();
var getHistory = require("./index");


function singleRun() {
    getHistory().then(function (stuff) {
        console.log(stuff);
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
}

singleRun();
//concurrencyLockTest();

//var edge = require('edge');
//
//// The text in edge.func() is C# code
//var helloWorld = edge.func('async (input) => { return input.ToString(); }');
//
//helloWorld('Hello World!', function (error, result) {
//    if (error) throw error;
//    console.log(result);
//});


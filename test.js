var getHistory = require("./index");

getHistory().then(function (stuff) {
    console.log(stuff);
}).catch(function (someError) {
    console.error(someError);
});
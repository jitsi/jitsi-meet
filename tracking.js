(function () {

function trackUsage(eventname, obj) {
    //console.log('track', eventname, obj);
    // implement your own tracking mechanism here
}
if (typeof exports !== 'undefined') {
    module.exports = trackUsage;
} else {
    window.trackUsage = trackUsage;
}

})();

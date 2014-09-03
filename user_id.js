var UserId = (function(my) {
    var userId;

    function supportsLocalStorage() {
        try {
            return 'localStorage' in window && window.localStorage !== null;
        } catch (e) {
            console.log("localstorage is not supported");
            return false;
        }
    }

    function generateUniqueId() {
        function _p8() {
            var p = (Math.random().toString(16)+"000000000").substr(2,8);
            return p.substr(0,4) + p.substr(4,4);
        }
        return _p8() + _p8() + _p8() + _p8();
    }

    if(supportsLocalStorage()) {
        if(!window.localStorage.meetJitsiId) {
            window.localStorage.meetJitsiId = generateUniqueId();
            console.log("generated id", window.localStorage.meetJitsiId);
        }
        userId = window.localStorage.meetJitsiId;
    } else {
        console.log("local storage is not supported");
        userId = generateUniqueId();
    }

    my.getUID = function() {
        return userId;
    };

    return my;
})(UserId || {});

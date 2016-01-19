var UIEvents = require("../../../service/UI/UIEvents");
var UIUtil = require('./UIUtil');

var nickname = null;
var eventEmitter = null;

var NicknameHandler = {
    init: function (emitter) {
        eventEmitter = emitter;
        var storedDisplayName = window.localStorage.displayname;
        if (storedDisplayName) {
           nickname = UIUtil.escapeHtml(storedDisplayName);
        }
    },
    setNickname: function (newNickname) {
        if (!newNickname || nickname === newNickname)
            return;

        nickname = newNickname;
        window.localStorage.displayname = UIUtil.unescapeHtml(nickname);
        eventEmitter.emit(UIEvents.NICKNAME_CHANGED, newNickname);
    },
    getNickname: function () {
        return nickname;
    },
    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    }
};

module.exports = NicknameHandler;
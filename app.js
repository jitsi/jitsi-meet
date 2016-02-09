/* global $, JitsiMeetJS, config */
/* application specific logic */

import "babel-polyfill";
import "jquery";
import "jquery-ui";
import "strophe";
import "strophe-disco";
import "strophe-caps";
import "tooltip";
import "popover";
import "jQuery-Impromptu";
import "autosize";
window.toastr = require("toastr");

import URLProcessor from "./modules/config/URLProcessor";
import RoomnameGenerator from './modules/util/RoomnameGenerator';

import UI from "./modules/UI/UI";
import settings from "./modules/settings/Settings";
import conference from './conference';
import API from './modules/API/API';

import UIEvents from './service/UI/UIEvents';


function buildRoomName () {
    let path = window.location.pathname;
    let roomName;

    // determinde the room node from the url
    // TODO: just the roomnode or the whole bare jid?
    if (config.getroomnode && typeof config.getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
        roomName = config.getroomnode(path);
    } else {
        /* fall back to default strategy
         * this is making assumptions about how the URL->room mapping happens.
         * It currently assumes deployment at root, with a rewrite like the
         * following one (for nginx):
         location ~ ^/([a-zA-Z0-9]+)$ {
         rewrite ^/(.*)$ / break;
         }
        */
        if (path.length > 1) {
            roomName = path.substr(1).toLowerCase();
        } else {
            let word = RoomnameGenerator.generateRoomWithoutSeparator();
            roomName = word.toLowerCase();
            window.history.pushState(
                'VideoChat', `Room: ${word}`, window.location.pathname + word
            );
        }
    }

    return roomName;
}

const APP = {
    UI,
    settings,
    conference,
    API,
    init () {
        this.keyboardshortcut =
            require("./modules/keyboardshortcut/keyboardshortcut");
        this.translation = require("./modules/translation/translation");
        this.configFetch = require("./modules/config/HttpConfigFetch");
    }
};

function init() {
    var isUIReady = APP.UI.start();
    if (isUIReady) {
        APP.conference.init({roomName: buildRoomName()}).then(function () {
            APP.UI.initConference();

            APP.UI.addListener(UIEvents.LANG_CHANGED, function (language) {
                APP.translation.setLanguage(language);
                APP.settings.setLanguage(language);
            });

            APP.keyboardshortcut.init();
        }).catch(function (err) {
            console.error(err);
        });
    }
}

/**
 * If we have an HTTP endpoint for getting config.json configured we're going to
 * read it and override properties from config.js and interfaceConfig.js.
 * If there is no endpoint we'll just continue with initialization.
 * Keep in mind that if the endpoint has been configured and we fail to obtain
 * the config for any reason then the conference won't start and error message
 * will be displayed to the user.
 */
function obtainConfigAndInit() {
    let roomName = APP.conference.roomName;

    if (config.configLocation) {
        APP.configFetch.obtainConfig(
            config.configLocation, roomName,
            // Get config result callback
            function(success, error) {
                if (success) {
                    console.log("(TIME) configuration fetched:\t",
                                window.performance.now());
                    init();
                } else {
                    // Show obtain config error,
                    // pass the error object for report
                    APP.UI.messageHandler.openReportDialog(
                        null, "dialog.connectError", error);
                }
            });
    } else {
        require("./modules/config/BoshAddressChoice").chooseAddress(
            config, roomName);

        init();
    }
}


$(document).ready(function () {
    console.log("(TIME) document ready:\t", window.performance.now());

    URLProcessor.setConfigParametersFromUrl();
    APP.init();

    APP.translation.init(settings.getLanguage());

    APP.API.init();

    obtainConfigAndInit();
});

$(window).bind('beforeunload', function () {
    APP.API.dispose();
});

module.exports = APP;

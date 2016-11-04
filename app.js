/* global $, config, getRoomName */
/* application specific logic */

import "babel-polyfill";
import "jquery";
import "jquery-contextmenu";
import "jquery-ui";
import "strophe";
import "strophe-disco";
import "strophe-caps";
import "jQuery-Impromptu";
import "autosize";

import 'aui';
import 'aui-experimental';
import 'aui-css';
import 'aui-experimental-css';

window.toastr = require("toastr");

import URLProcessor from "./modules/config/URLProcessor";
import RoomnameGenerator from './modules/util/RoomnameGenerator';

import UI from "./modules/UI/UI";
import settings from "./modules/settings/Settings";
import conference from './conference';
import ConferenceUrl from './modules/URL/ConferenceUrl';
import API from './modules/API/API';

import UIEvents from './service/UI/UIEvents';
import getTokenData from "./modules/tokendata/TokenData";
import translation from "./modules/translation/translation";

/**
 * Tries to push history state with the following parameters:
 * 'VideoChat', `Room: ${roomName}`, URL. If fail, prints the error and returns
 * it.
 */
function pushHistoryState(roomName, URL) {
    try {
        window.history.pushState(
            'VideoChat', `Room: ${roomName}`, URL
        );
    } catch (e) {
        console.warn("Push history state failed with parameters:",
            'VideoChat', `Room: ${roomName}`, URL, e);
        return e;
    }
    return null;
}

/**
 * Replaces current history state(replaces the URL displayed by the browser).
 * @param {string} newUrl the URL string which is to be displayed by the browser
 * to the user.
 */
function replaceHistoryState (newUrl) {
    if (window.history
        && typeof window.history.replaceState === 'function') {
        window.history.replaceState({}, document.title, newUrl);
    }
}

/**
 * Builds and returns the room name.
 */
function buildRoomName () {
    let roomName = getRoomName();

    if(!roomName) {
        let word = RoomnameGenerator.generateRoomWithoutSeparator();
        roomName = word.toLowerCase();
        let historyURL = window.location.href + word;
        //Trying to push state with current URL + roomName
        pushHistoryState(word, historyURL);
    }

    return roomName;
}

const APP = {
    // Used by do_external_connect.js if we receive the attach data after
    // connect was already executed. status property can be "initialized",
    // "ready" or "connecting". We are interested in "ready" status only which
    // means that connect was executed but we have to wait for the attach data.
    // In status "ready" handler property will be set to a function that will
    // finish the connect process when the attach data or error is received.
    connect: {
        status: "initialized",
        handler: null
    },
    // Used for automated performance tests
    connectionTimes: {
        "index.loaded": window.indexLoadedTime
    },
    UI,
    settings,
    conference,
    translation,
    /**
     * After the APP has been initialized provides utility methods for dealing
     * with the conference room URL(address).
     * @type ConferenceUrl
     */
    ConferenceUrl : null,
    connection: null,
    API,
    init () {
        this.keyboardshortcut =
            require("./modules/keyboardshortcut/keyboardshortcut");
        this.configFetch = require("./modules/config/HttpConfigFetch");
        this.tokenData = getTokenData();
    }
};

/**
 * If JWT token data it will be used for local user settings
 */
function setTokenData() {
    let localUser = APP.tokenData.caller;
    if(localUser) {
        APP.settings.setEmail((localUser.getEmail() || "").trim(), true);
        APP.settings.setAvatarUrl((localUser.getAvatarUrl() || "").trim());
        APP.settings.setDisplayName((localUser.getName() || "").trim(), true);
    }
}

function init() {
    setTokenData();
    // Initialize the conference URL handler
    APP.ConferenceUrl = new ConferenceUrl(window.location);
    // Clean up the URL displayed by the browser
    replaceHistoryState(APP.ConferenceUrl.getInviteUrl());
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
            APP.UI.hideRingOverLay();
            APP.API.notifyConferenceLeft(APP.conference.roomName);
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
                    var now = APP.connectionTimes["configuration.fetched"] =
                        window.performance.now();
                    console.log("(TIME) configuration fetched:\t", now);
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
    var now = APP.connectionTimes["document.ready"] = window.performance.now();
    console.log("(TIME) document ready:\t", now);

    URLProcessor.setConfigParametersFromUrl();
    APP.init();

    APP.translation.init(settings.getLanguage());

    APP.API.init(APP.tokenData.externalAPISettings);

    obtainConfigAndInit();
});

$(window).bind('beforeunload', function () {
    APP.API.dispose();
});

module.exports = APP;

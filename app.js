/* application specific logic */

import "jquery";
import "jquery-contextmenu";
import "jquery-ui";
import "strophe";
import "strophe-disco";
import "jQuery-Impromptu";
import "autosize";

import 'aui';
import 'aui-experimental';
import 'aui-css';
import 'aui-experimental-css';

window.toastr = require("toastr");

import UI from "./modules/UI/UI";
import settings from "./modules/settings/Settings";
import conference from './conference';
import API from './modules/API/API';

import translation from "./modules/translation/translation";
import remoteControl from "./modules/remotecontrol/RemoteControl";

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
     * The log collector which captures JS console logs for this app.
     * @type {LogCollector}
     */
    logCollector: null,
    /**
     * Indicates if the log collector has been started (it will not be started
     * if the welcome page is displayed).
     */
    logCollectorStarted : false,
    /**
     * After the APP has been initialized provides utility methods for dealing
     * with the conference room URL(address).
     * @type ConferenceUrl
     */
    ConferenceUrl : null,
    connection: null,
    API,
    remoteControl
};

// TODO The execution of the mobile app starts from react/index.native.js.
// Similarly, the execution of the Web app should start from react/index.web.js
// for the sake of consistency and ease of understanding. Temporarily though
// because we are at the beginning of introducing React into the Web app, allow
// the execution of the Web app to start from app.js in order to reduce the
// complexity of the beginning step.
require('./react');

module.exports = APP;

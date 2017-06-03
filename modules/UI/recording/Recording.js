/* global APP, $, config, interfaceConfig, JitsiMeetJS */
/*
 * Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from '../util/UIUtil';
import VideoLayout from '../videolayout/VideoLayout';
import Feedback from '../feedback/Feedback.js';

import { setToolboxEnabled } from '../../../react/features/toolbox';

/**
 * The dialog for user input.
 */
let dialog = null;

/**
 * Indicates if the recording button should be enabled.
 *
 * @returns {boolean} {true} if the
 * @private
 */
function _isRecordingButtonEnabled() {
    return (
        interfaceConfig.TOOLBAR_BUTTONS.indexOf("recording") !== -1
            && config.enableRecording
            && APP.conference.isRecordingSupported());
}

/**
 * Request live stream token from the user.
 * @returns {Promise}
 */
function _requestLiveStreamId() {
    const cancelButton
        = APP.translation.generateTranslationHTML("dialog.Cancel");
    const backButton = APP.translation.generateTranslationHTML("dialog.Back");
    const startStreamingButton
        = APP.translation.generateTranslationHTML("dialog.startLiveStreaming");
    const streamIdRequired
        = APP.translation.generateTranslationHTML(
            "liveStreaming.streamIdRequired");
    const streamIdHelp
        = APP.translation.generateTranslationHTML(
            "liveStreaming.streamIdHelp");

    return new Promise(function (resolve, reject) {
        dialog = APP.UI.messageHandler.openDialogWithStates({
            state0: {
                titleKey: "dialog.liveStreaming",
                html:
                    `<input  class="input-control"
                    name="streamId" type="text"
                    data-i18n="[placeholder]dialog.streamKey"
                    autofocus><div style="text-align: right">
                    <a class="helper-link" target="_new"
                    href="${interfaceConfig.LIVE_STREAMING_HELP_LINK}">`
                        + streamIdHelp
                        + `</a></div>`,
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: startStreamingButton, value: true}
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit: function (e, v, m, f) {
                    e.preventDefault();

                    if (v) {
                        if (f.streamId && f.streamId.length > 0) {
                            resolve(UIUtil.escapeHtml(f.streamId));
                            dialog.close();
                            return;
                        }
                        else {
                            dialog.goToState('state1');
                            return false;
                        }
                    } else {
                        reject(APP.UI.messageHandler.CANCEL);
                        dialog.close();
                        return false;
                    }
                }
            },

            state1: {
                titleKey: "dialog.liveStreaming",
                html: streamIdRequired,
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: backButton, value: true}
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit: function (e, v) {
                    e.preventDefault();
                    if (v === 0) {
                        reject(APP.UI.messageHandler.CANCEL);
                        dialog.close();
                    } else {
                        dialog.goToState('state0');
                    }
                }
            }
        }, {
            close: function () {
                dialog = null;
            }
        });
    });
}

/**
 * Request recording token from the user.
 * @returns {Promise}
 */
function _requestRecordingToken() {
    let titleKey = "dialog.recordingToken";
    let messageString = (
        `<input name="recordingToken" type="text"
                data-i18n="[placeholder]dialog.token"
                class="input-control"
                autofocus>`
    );
    return new Promise(function (resolve, reject) {
        dialog = APP.UI.messageHandler.openTwoButtonDialog({
            titleKey,
            messageString,
            leftButtonKey: 'dialog.Save',
            submitFunction: function (e, v, m, f) {
                if (v && f.recordingToken) {
                    resolve(UIUtil.escapeHtml(f.recordingToken));
                } else {
                    reject(APP.UI.messageHandler.CANCEL);
                }
            },
            closeFunction: function () {
                dialog = null;
            },
            focus: ':input:first'
        });
    });
}

/**
 * Shows a prompt dialog to the user when they have toggled off the recording.
 *
 * @param recordingType the recording type
 * @returns {Promise}
 * @private
 */
function _showStopRecordingPrompt(recordingType) {
    var title;
    var message;
    var buttonKey;
    if (recordingType === "jibri") {
        title = "dialog.liveStreaming";
        message = "dialog.stopStreamingWarning";
        buttonKey = "dialog.stopLiveStreaming";
    }
    else {
        title = "dialog.recording";
        message = "dialog.stopRecordingWarning";
        buttonKey = "dialog.stopRecording";
    }

    return new Promise((resolve, reject) => {
        dialog = APP.UI.messageHandler.openTwoButtonDialog({
            titleKey: title,
            msgKey: message,
            leftButtonKey: buttonKey,
            submitFunction: (e, v) => (v ? resolve : reject)(),
            closeFunction: () => {
                dialog = null;
            }
        });
    });
}

/**
 * Moves the element given by {selector} to the top right corner of the screen.
 * Set additional classes that can be used to style the selector relative to the
 * state of the filmstrip.
 *
 * @param selector the selector for the element to move
 * @param move {true} to move the element, {false} to move it back to its intial
 * position
 */
function moveToCorner(selector, move) {
    let moveToCornerClass = "moveToCorner";
    let containsClass = selector.hasClass(moveToCornerClass);

    if (move && !containsClass)
        selector.addClass(moveToCornerClass);
    else if (!move && containsClass)
        selector.removeClass(moveToCornerClass);

    const {
        remoteVideosVisible,
        visible
    } = APP.store.getState()['features/filmstrip'];
    const filmstripWasHidden = selector.hasClass('without-filmstrip');
    const filmstipIsOpening = filmstripWasHidden && visible;
    selector.toggleClass('opening', filmstipIsOpening);

    selector.toggleClass('with-filmstrip', visible);
    selector.toggleClass('without-filmstrip', !visible);

    selector.toggleClass('with-remote-videos', remoteVideosVisible);
    selector.toggleClass('without-remote-videos', !remoteVideosVisible);
}

/**
 * The status of the recorder.
 * FIXME: Those constants should come from the library.
 * @type {{ON: string, OFF: string, AVAILABLE: string,
 * UNAVAILABLE: string, PENDING: string}}
 */
var Status = {
    ON: "on",
    OFF: "off",
    AVAILABLE: "available",
    UNAVAILABLE: "unavailable",
    PENDING: "pending",
    RETRYING: "retrying",
    ERROR: "error",
    FAILED: "failed",
    BUSY: "busy"
};

/**
 * Checks whether if the given status is either PENDING or RETRYING
 * @param status {Status} Jibri status to be checked
 * @returns {boolean} true if the condition is met or false otherwise.
 */
function isStartingStatus(status) {
    return status === Status.PENDING || status === Status.RETRYING;
}

/**
 * Manages the recording user interface and user experience.
 * @type {{init, initRecordingButton, showRecordingButton, updateRecordingState,
 * updateRecordingUI, checkAutoRecord}}
 */
var Recording = {
    /**
     * Initializes the recording UI.
     */
    init(eventEmitter, recordingType) {
        this.eventEmitter = eventEmitter;
        this.recordingType = recordingType;

        this.updateRecordingState(APP.conference.getRecordingState());

        if (recordingType === 'jibri') {
            this.baseClass = "fa fa-play-circle";
            this.recordingTitle = "dialog.liveStreaming";
            this.recordingOnKey = "liveStreaming.on";
            this.recordingOffKey = "liveStreaming.off";
            this.recordingPendingKey = "liveStreaming.pending";
            this.failedToStartKey = "liveStreaming.failedToStart";
            this.recordingErrorKey = "liveStreaming.error";
            this.recordingButtonTooltip = "liveStreaming.buttonTooltip";
            this.recordingUnavailable = "liveStreaming.unavailable";
            this.recordingBusy = "liveStreaming.busy";
        }
        else {
            this.baseClass = "icon-recEnable";
            this.recordingTitle = "dialog.recording";
            this.recordingOnKey = "recording.on";
            this.recordingOffKey = "recording.off";
            this.recordingPendingKey = "recording.pending";
            this.failedToStartKey = "recording.failedToStart";
            this.recordingErrorKey = "recording.error";
            this.recordingButtonTooltip = "recording.buttonTooltip";
            this.recordingUnavailable = "recording.unavailable";
            this.recordingBusy = "liveStreaming.busy";
        }

        // XXX Due to the React-ification of Toolbox, the HTMLElement with id
        // toolbar_button_record may not exist yet.
        $(document).on(
            'click',
            '#toolbar_button_record',
            ev => this._onToolbarButtonClick(ev));

        // If I am a recorder then I publish my recorder custom role to notify
        // everyone.
        if (config.iAmRecorder) {
            VideoLayout.enableDeviceAvailabilityIcons(
                APP.conference.getMyUserId(), false);
            VideoLayout.setLocalVideoVisible(false);
            Feedback.enableFeedback(false);
            APP.store.dispatch(setToolboxEnabled(false));
            APP.UI.messageHandler.enableNotifications(false);
            APP.UI.messageHandler.enablePopups(false);
        }

        this.eventEmitter.addListener(UIEvents.UPDATED_FILMSTRIP_DISPLAY, () =>{
            this._updateStatusLabel();
        });
    },

    /**
     * Initialise the recording button.
     */
    initRecordingButton() {
        const selector = $('#toolbar_button_record');

        UIUtil.setTooltip(selector, 'liveStreaming.buttonTooltip', 'right');

        selector.addClass(this.baseClass);
        selector.attr("data-i18n", "[content]" + this.recordingButtonTooltip);
        APP.translation.translateElement(selector);
    },

    /**
     * Shows or hides the 'recording' button.
     * @param show {true} to show the recording button, {false} to hide it
     */
    showRecordingButton(show) {
        let shouldShow = show && _isRecordingButtonEnabled();
        let id = 'toolbar_button_record';

        UIUtil.setVisible(id, shouldShow);
    },

    /**
     * Updates the recording state UI.
     * @param recordingState gives us the current recording state
     */
    updateRecordingState(recordingState) {
        // I'm the recorder, so I don't want to see any UI related to states.
        if (config.iAmRecorder)
            return;

        // If there's no state change, we ignore the update.
        if (!recordingState || this.currentState === recordingState)
            return;

        this.updateRecordingUI(recordingState);
    },

    /**
     * Sets the state of the recording button.
     * @param recordingState gives us the current recording state
     */
    updateRecordingUI(recordingState) {

        let oldState = this.currentState;
        this.currentState = recordingState;

        // TODO: handle recording state=available
        if (recordingState === Status.ON ||
            recordingState === Status.RETRYING) {

            this._setToolbarButtonToggled(true);

            this._updateStatusLabel(this.recordingOnKey, false);
        }
        else if (recordingState === Status.OFF
                || recordingState === Status.UNAVAILABLE
                || recordingState === Status.BUSY
                || recordingState === Status.FAILED) {

            // We don't want to do any changes if this is
            // an availability change.
            if (oldState !== Status.ON
                && !isStartingStatus(oldState))
                return;

            this._setToolbarButtonToggled(false);

            let messageKey;
            if (isStartingStatus(oldState))
                messageKey = this.failedToStartKey;
            else
                messageKey = this.recordingOffKey;

            this._updateStatusLabel(messageKey, true);

            setTimeout(function(){
                $('#recordingLabel').css({display: "none"});
            }, 5000);
        }
        else if (recordingState === Status.PENDING) {

            this._setToolbarButtonToggled(false);

            this._updateStatusLabel(this.recordingPendingKey, true);
        }
        else if (recordingState === Status.ERROR
                    || recordingState === Status.FAILED) {

            this._setToolbarButtonToggled(false);

            this._updateStatusLabel(this.recordingErrorKey, true);
        }

        let labelSelector = $('#recordingLabel');

        // We don't show the label for available state.
        if (recordingState !== Status.AVAILABLE
            && !labelSelector.is(":visible"))
            labelSelector.css({display: "inline-block"});

        // Recording spinner
        let spinnerId = 'recordingSpinner';
        UIUtil.setVisible(
            spinnerId, recordingState === Status.RETRYING);
    },
    // checks whether recording is enabled and whether we have params
    // to start automatically recording
    checkAutoRecord() {
        if (_isRecordingButtonEnabled && config.autoRecord) {
            this.predefinedToken = UIUtil.escapeHtml(config.autoRecordToken);
            this.eventEmitter.emit(UIEvents.RECORDING_TOGGLED,
                                    this.predefinedToken);
        }
    },
    /**
     * Updates the status label.
     * @param textKey the text to show
     * @param isCentered indicates if the label should be centered on the window
     * or moved to the top right corner.
     */
    _updateStatusLabel(textKey, isCentered) {
        let labelSelector = $('#recordingLabel');
        let labelTextSelector = $('#recordingLabelText');

        moveToCorner(labelSelector, !isCentered);

        labelTextSelector.attr("data-i18n", textKey);
        APP.translation.translateElement(labelSelector);
    },

    /**
     * Handles {@code click} on {@code toolbar_button_record}.
     *
     * @returns {void}
     */
    _onToolbarButtonClick() {
        if (dialog) {
            return;
        }

        JitsiMeetJS.analytics.sendEvent('recording.clicked');
        switch (this.currentState) {
        case Status.ON:
        case Status.RETRYING:
        case Status.PENDING: {
            _showStopRecordingPrompt(this.recordingType).then(
                () => {
                    this.eventEmitter.emit(UIEvents.RECORDING_TOGGLED);
                    JitsiMeetJS.analytics.sendEvent('recording.stopped');
                },
                () => {});
            break;
        }
        case Status.AVAILABLE:
        case Status.OFF: {
            if (this.recordingType === 'jibri')
                _requestLiveStreamId().then(streamId => {
                    this.eventEmitter.emit(
                        UIEvents.RECORDING_TOGGLED,
                        { streamId });
                    JitsiMeetJS.analytics.sendEvent('recording.started');
                }).catch(reason => {
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        logger.error(reason);
                    else
                        JitsiMeetJS.analytics.sendEvent('recording.canceled');
                });
            else {
                if (this.predefinedToken) {
                    this.eventEmitter.emit(
                        UIEvents.RECORDING_TOGGLED,
                        { token: this.predefinedToken });
                    JitsiMeetJS.analytics.sendEvent('recording.started');
                    return;
                }

                _requestRecordingToken().then((token) => {
                    this.eventEmitter.emit(
                        UIEvents.RECORDING_TOGGLED,
                        { token });
                    JitsiMeetJS.analytics.sendEvent('recording.started');
                }).catch(reason => {
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        logger.error(reason);
                    else
                        JitsiMeetJS.analytics.sendEvent('recording.canceled');
                });
            }
            break;
        }
        case Status.BUSY: {
            dialog = APP.UI.messageHandler.openMessageDialog(
                this.recordingTitle,
                this.recordingBusy,
                null,
                () => {
                    dialog = null;
                }
            );
            break;
        }
        default: {
            dialog = APP.UI.messageHandler.openMessageDialog(
                this.recordingTitle,
                this.recordingUnavailable,
                null,
                () => {
                    dialog = null;
                }
            );
        }
        }
    },

    /**
     * Sets the toggled state of the recording toolbar button.
     *
     * @param {boolean} isToggled indicates if the button should be toggled
     * or not
     */
    _setToolbarButtonToggled(isToggled) {
        $("#toolbar_button_record").toggleClass("toggled", isToggled);
    }
};

export default Recording;

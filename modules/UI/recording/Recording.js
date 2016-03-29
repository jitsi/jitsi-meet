/* global APP, $, config, interfaceConfig */
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
import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from '../util/UIUtil';

/**
 * Recording.
 */
let recordingToaster = null;

function _isRecordingButtonEnabled() {
    return interfaceConfig.TOOLBAR_BUTTONS.indexOf("recording") !== -1
            && config.enableRecording;
}

/**
 * Request live stream token from the user.
 * @returns {Promise}
 */
function _requestLiveStreamId() {
    let msg = APP.translation.generateTranslationHTML("dialog.liveStreaming");
    let token = APP.translation.translateString("dialog.streamKey");
    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog(
            null, null, null,
            `<h2>${msg}</h2>
             <input name="streamId" type="text"
                    data-i18n="[placeholder]dialog.streamKey"
                    placeholder="${token}" autofocus>`,
            false, "dialog.startLiveStreaming",
            function (e, v, m, f) {
                if (v && f.streamId) {
                    resolve(UIUtil.escapeHtml(f.streamId));
                } else {
                    reject();
                }
            },
            null,
            function () { },
            ':input:first'
        );
    });
}

/**
 * Request recording token from the user.
 * @returns {Promise}
 */
function _requestRecordingToken () {
    let msg = APP.translation.generateTranslationHTML("dialog.recordingToken");
    let token = APP.translation.translateString("dialog.token");

    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog(
            null, null, null,
            `<h2>${msg}</h2>
             <input name="recordingToken" type="text"
                    data-i18n="[placeholder]dialog.token"
                    placeholder="${token}" autofocus>`,
            false, "dialog.Save",
            function (e, v, m, f) {
                if (v && f.recordingToken) {
                    resolve(UIUtil.escapeHtml(f.recordingToken));
                } else {
                    reject();
                }
            },
            null,
            function () { },
            ':input:first'
        );
    });
}

function _showStopRecordingPrompt (recordingType) {
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

    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog(
            title,
            null,
            message,
            null,
            false,
            buttonKey,
            function(e,v,m,f) {
                if (v) {
                    resolve();
                } else {
                    reject();
                }
            }
        );
    });
}

function moveToCorner(selector, move) {
    let moveToCornerClass = "moveToCorner";

    if (move && !selector.hasClass(moveToCornerClass))
        selector.addClass(moveToCornerClass);
    else
        selector.removeClass(moveToCornerClass);
}

var Recording = {
    /**
     * Initializes the recording UI.
     */
    init (emitter, recordingType) {
        this.eventEmitter = emitter;

        this.initRecordingButton(recordingType);
    },

    initRecordingButton(recordingType) {
        let selector = $('#toolbar_button_record');

        if (recordingType === 'jibri') {
            this.baseClass = "fa fa-play-circle";
            this.recordingOnKey = "liveStreaming.on";
            this.recordingOffKey = "liveStreaming.off";
            this.recordingPendingKey = "liveStreaming.pending";
            this.failedToStartKey = "liveStreaming.failedToStart";
        }
        else {
            this.baseClass = "icon-recEnable";
            this.recordingOnKey = "recording.on";
            this.recordingOffKey = "recording.off";
            this.recordingPendingKey = "recording.pending";
            this.failedToStartKey = "recording.failedToStart";
        }

        selector.addClass(this.baseClass);

        var self = this;
        selector.click(function () {
            console.log("BUTTON CLICKED", self.currentState);
            switch (self.currentState) {
                case "on": {
                    _showStopRecordingPrompt(recordingType).then(() =>
                        self.eventEmitter.emit(UIEvents.RECORDING_TOGGLED));
                }
                    break;
                case "available":
                case "off": {
                    if (recordingType === 'jibri')
                        _requestLiveStreamId().then((streamId) => {
                            self.eventEmitter.emit( UIEvents.RECORDING_TOGGLED,
                                {streamId: streamId});
                        });
                    else {
                        if (self.predefinedToken) {
                            self.eventEmitter.emit( UIEvents.RECORDING_TOGGLED,
                                {token: self.predefinedToken});
                            return;
                        }

                        _requestRecordingToken().then((token) => {
                            self.eventEmitter.emit( UIEvents.RECORDING_TOGGLED,
                                {token: token});
                        });
                    }
                }
                    break;
                default: {
                    APP.UI.messageHandler.openMessageDialog(
                        "dialog.liveStreaming",
                        "liveStreaming.unavailable"
                    );
                }
            }
        });
    },

    // Shows or hides the 'recording' button.
    showRecordingButton (show) {
        if (_isRecordingButtonEnabled() && show) {
            $('#toolbar_button_record').css({display: "inline-block"});
        } else {
            $('#toolbar_button_record').css({display: "none"});
        }
    },

    updateRecordingState(recordingState) {
        this.setRecordingButtonState(recordingState);
    },

    // Sets the state of the recording button
    setRecordingButtonState (recordingState) {
        let buttonSelector = $('#toolbar_button_record');
        let labelSelector = $('#recordingLabel');

        // TODO: handle recording state=available
        if (recordingState === 'on') {

            buttonSelector.removeClass(this.baseClass);
            buttonSelector.addClass(this.baseClass + " active");

            labelSelector.attr("data-i18n", this.recordingOnKey);
            moveToCorner(labelSelector, true, 3000);
            labelSelector
                .text(APP.translation.translateString(this.recordingOnKey));
        } else if (recordingState === 'off') {

            buttonSelector.removeClass(this.baseClass + " active");
            buttonSelector.addClass(this.baseClass);

            moveToCorner(labelSelector, false);
            let messageKey;
            if (this.currentState === "pending")
                messageKey = this.failedToStartKey;
            else
                messageKey = this.recordingOffKey;

            labelSelector.attr("data-i18n", messageKey);
            labelSelector.text(APP.translation.translateString(messageKey));

            setTimeout(function(){
                $('#recordingLabel').css({display: "none"});
            }, 5000);
        } else if (recordingState === 'pending') {

            buttonSelector.removeClass(this.baseClass + " active");
            buttonSelector.addClass(this.baseClass);

            moveToCorner(labelSelector, false);
            labelSelector
                .attr("data-i18n", this.recordingPendingKey);
            labelSelector
                .text(APP.translation.translateString(
                    this.recordingPendingKey));
        }

        this.currentState = recordingState;

        if (!labelSelector.is(":visible"))
            labelSelector.css({display: "inline-block"});
    },
    // checks whether recording is enabled and whether we have params
    // to start automatically recording
    checkAutoRecord () {
        if (_isRecordingButtonEnabled && config.autoRecord) {
            this.predefinedToken = UIUtil.escapeHtml(config.autoRecordToken);
            this.eventEmitter.emit(UIEvents.RECORDING_TOGGLED,
                                    this.predefinedToken);
        }
    }
};

export default Recording;

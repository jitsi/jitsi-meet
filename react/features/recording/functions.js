// @flow

import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';

import { RECORDING_STATUS_PRIORITIES } from './constants';

const logger = require('jitsi-meet-logger').getLogger(__filename);


import {
    downloadUrl
} from '../local-recording/recording';

/**
 * Searches in the passed in redux state for an active recording session of the
 * passed in mode.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} mode - Find an active recording session of the given mode.
 * @returns {Object|undefined}
 */
export function getActiveSession(state: Object, mode: string) {
    const { sessionDatas } = state['features/recording'];
    const { status: statusConstants } = JitsiRecordingConstants;

    return sessionDatas.find(sessionData => sessionData.mode === mode
        && (sessionData.status === statusConstants.ON
            || sessionData.status === statusConstants.PENDING));
}

/**
 * Returns an estimated recording duration based on the size of the video file
 * in MB. The estimate is calculated under the assumption that 1 min of recorded
 * video needs 10MB of storage on avarage.
 *
 * @param {number} size - The size in MB of the recorded video.
 * @returns {number} - The estimated duration in minutes.
 */
export function getRecordingDurationEstimation(size: ?number) {
    return Math.floor((size || 0) / 10);
}

/**
 * Searches in the passed in redux state for a recording session that matches
 * the passed in recording session ID.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} id - The ID of the recording session to find.
 * @returns {Object|undefined}
 */
export function getSessionById(state: Object, id: string) {
    return state['features/recording'].sessionDatas.find(
        sessionData => sessionData.id === id);
}

/**
 * Returns the recording session status that is to be shown in a label. E.g. If
 * there is a session with the status OFF and one with PENDING, then the PENDING
 * one will be shown, because that is likely more important for the user to see.
 *
 * @param {Object} state - The redux state to search in.
 * @param {string} mode - The recording mode to get status for.
 * @returns {string|undefined}
 */
export function getSessionStatusToShow(state: Object, mode: string): ?string {
    const recordingSessions = state['features/recording'].sessionDatas;
    let status;

    if (Array.isArray(recordingSessions)) {
        for (const session of recordingSessions) {
            if (session.mode === mode
                    && (!status
                        || (RECORDING_STATUS_PRIORITIES.indexOf(session.status)
                            > RECORDING_STATUS_PRIORITIES.indexOf(status)))) {
                status = session.status;
            }
        }
    }

    return status;
}


let dialog = null;
let checkFileTimeout = null;
export function showDownloadDialog(roomName) {
    const i18n = APP.translation;
    const downloadMsg
        = i18n.generateTranslationHTML('dialog.DownloadRecordFileMsg');
    const downloadingMsg
        = i18n.generateTranslationHTML('dialog.DownloadingRecordFileMsg');
    const cancelButton = i18n.generateTranslationHTML('dialog.Cancel');
    const downloadButton = i18n.generateTranslationHTML('dialog.Download');
    dialog = APP.UI.messageHandler.openDialogWithStates({
        state0: {
            titleKey: 'dialog.DownloadRecordFileTitle',
            html: downloadMsg,
            persistent: false,
            buttons: [
                { title: cancelButton,
                    value: false },
                { title: downloadButton,
                    value: true }
            ],
            focus: ':input:first',
            defaultButton: 1,
            submit(e, v, m, f) { // eslint-disable-line max-params
                e.preventDefault();
                if (!v) {
                    if (checkFileTimeout !== null) {
                        clearTimeout(checkFileTimeout);
                        checkFileTimeout = null;
                    }
                    dialog.close();
                    return;
                }
                dialog.goToState('state1');
                _startCheckFileTimer(roomName);
            }
        },

        state1: {
            titleKey: 'dialog.DownloadRecordFileTitle',
            html: downloadingMsg,
            persistent: false,
            buttons: [
                { title: cancelButton,
                    value: false }
            ],
            focus: ':input:first',
            defaultButton: 0,
            submit(e, v) {
                e.preventDefault();
                if (checkFileTimeout !== null) {
                    clearTimeout(checkFileTimeout);
                    checkFileTimeout = null;
                }
                dialog.close();
            }
        }
    }, {
        close() {
            dialog = null;
        }
    }, {
    });
    // dialog = APP.UI.messageHandler.openTwoButtonDialog({
    //     titleKey: 'dialog.DownloadRecordFileTitle',
    //     msgKey: 'dialog.DownloadRecordFileMsg',
    //     leftButtonKey: 'dialog.Download',
    //     submitFunction,
    //     closeFunction
    // });
}

function _startCheckFileTimer(roomName){

    checkFileTimeout = setTimeout(() => {
        fetch('/record/'+roomName+'.mp4',{ method:'HEAD' })
            .then(response => {
                if(response.status != '200'){
                    logger.log("file not exit!");
                    _startCheckFileTimer(roomName);
                    return;
                }     
                logger.log("file found!");           
                clearTimeout(checkFileTimeout);
                checkFileTimeout = null;
                downloadUrl('/record/'+roomName+'.mp4', roomName+'.mp4');
                dialog.close();
            })
            .catch(error => {
                logger.log("file not exit!");
                _startCheckFileTimer(roomName);
            });

    }, 1000);
}
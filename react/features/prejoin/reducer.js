import { ReducerRegistry } from '../base/redux';

import {
    ADD_PREJOIN_AUDIO_TRACK,
    ADD_PREJOIN_CONTENT_SHARING_TRACK,
    ADD_PREJOIN_VIDEO_TRACK,
    SET_DEVICE_STATUS,
    SET_DIALOUT_NUMBER,
    SET_DIALOUT_COUNTRY,
    SET_DIALOUT_STATUS,
    SET_JOIN_BY_PHONE_DIALOG_VISIBLITY,
    SET_SKIP_PREJOIN,
    SET_PREJOIN_AUDIO_DISABLED,
    SET_PREJOIN_AUDIO_MUTED,
    SET_PREJOIN_DEVICE_ERRORS,
    SET_PREJOIN_PAGE_VISIBILITY,
    SET_PREJOIN_VIDEO_DISABLED,
    SET_PREJOIN_VIDEO_MUTED
} from './actionTypes';

const DEFAULT_STATE = {
    audioDisabled: false,
    audioMuted: false,
    audioTrack: null,
    contentSharingTrack: null,
    country: '',
    deviceStatusText: 'prejoin.configuringDevices',
    deviceStatusType: 'ok',
    dialOutCountry: {
        name: 'United States',
        dialCode: '1',
        code: 'us'
    },
    dialOutNumber: '',
    dialOutStatus: 'prejoin.dialing',
    name: '',
    rawError: '',
    showPrejoin: true,
    showJoinByPhoneDialog: false,
    userSelectedSkipPrejoin: false,
    videoTrack: null,
    videoDisabled: false,
    videoMuted: false
};

/**
 * Listen for actions that mutate the prejoin state
 */
ReducerRegistry.register(
    'features/prejoin', (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case ADD_PREJOIN_AUDIO_TRACK: {
            return {
                ...state,
                audioTrack: action.value
            };
        }

        case ADD_PREJOIN_CONTENT_SHARING_TRACK: {
            return {
                ...state,
                contentSharingTrack: action.value
            };
        }

        case ADD_PREJOIN_VIDEO_TRACK: {
            return {
                ...state,
                videoTrack: action.value
            };
        }

        case SET_SKIP_PREJOIN: {
            return {
                ...state,
                userSelectedSkipPrejoin: action.value
            };
        }

        case SET_PREJOIN_PAGE_VISIBILITY:
            return {
                ...state,
                showPrejoin: action.value
            };

        case SET_PREJOIN_VIDEO_DISABLED: {
            return {
                ...state,
                videoDisabled: action.value
            };
        }

        case SET_PREJOIN_VIDEO_MUTED:
            return {
                ...state,
                videoMuted: action.value
            };

        case SET_PREJOIN_AUDIO_MUTED:
            return {
                ...state,
                audioMuted: action.value
            };

        case SET_PREJOIN_DEVICE_ERRORS: {
            const status = getStatusFromErrors(action.value);

            return {
                ...state,
                ...status
            };
        }

        case SET_DEVICE_STATUS: {
            return {
                ...state,
                deviceStatusText: action.text,
                deviceStatusType: action.type
            };
        }

        case SET_PREJOIN_AUDIO_DISABLED: {
            return {
                ...state,
                audioDisabled: true
            };
        }

        case SET_DIALOUT_NUMBER: {
            return {
                ...state,
                dialOutNumber: action.value
            };
        }

        case SET_DIALOUT_COUNTRY: {
            return {
                ...state,
                dialOutCountry: action.value
            };
        }

        case SET_DIALOUT_STATUS: {
            return {
                ...state,
                dialOutStatus: action.value
            };
        }

        case SET_JOIN_BY_PHONE_DIALOG_VISIBLITY: {
            return {
                ...state,
                showJoinByPhoneDialog: action.value
            };
        }

        default:
            return state;
        }
    },
);

/**
 * Returns a suitable error object based on the track errors.
 *
 * @param {Object} errors - The errors got while creating local tracks.
 * @returns {Object}
 */
function getStatusFromErrors(errors) {
    const { audioOnlyError, videoOnlyError, audioAndVideoError } = errors;

    if (audioAndVideoError) {
        if (audioOnlyError) {
            if (videoOnlyError) {
                return {
                    deviceStatusType: 'warning',
                    deviceStatusText: 'prejoin.audioAndVideoError',
                    rawError: audioAndVideoError.message
                };
            }

            return {
                deviceStatusType: 'warning',
                deviceStatusText: 'prejoin.audioOnlyError',
                rawError: audioOnlyError.message
            };
        }

        return {
            deviceStatusType: 'warning',
            deviceStatusText: 'prejoin.videoOnlyError',
            rawError: audioAndVideoError.message
        };
    }

    return {
        deviceStatusType: 'ok',
        deviceStatusText: 'prejoin.lookGood',
        rawError: ''
    };
}

import { ReducerRegistry } from '../base/redux';

import {
    ADD_JANE_WAITING_AREA_AUDIO_TRACK,
    ADD_JANE_WAITING_AREA_CONTENT_SHARING_TRACK,
    ADD_JANE_WAITING_AREA_VIDEO_TRACK,
    SET_DEVICE_STATUS,
    SET_JANE_WAITING_AREA_AUDIO_DISABLED,
    SET_JANE_WAITING_AREA_AUDIO_MUTED,
    SET_JANE_WAITING_AREA_DEVICE_ERRORS,
    SET_JANE_WAITING_AREA_PAGE_VISIBILITY,
    SET_JANE_WAITING_AREA_VIDEO_DISABLED,
    SET_JANE_WAITING_AREA_VIDEO_MUTED,
    UPDATE_REMOTE_PARTICIPANT_STATUSES
} from './actionTypes';

const DEFAULT_STATE = {
    audioDisabled: false,
    audioMuted: false,
    audioTrack: null,
    deviceStatusText: 'janeWaitingArea.configuringDevices',
    deviceStatusType: 'ok',
    name: '',
    rawError: '',
    showJaneWaitingArea: true,
    showJoinByPhoneDialog: false,
    userSelectedSkipJaneWaitingArea: false,
    videoTrack: null,
    videoDisabled: false,
    videoMuted: false,
    remoteParticipantsStatuses: []
};

/**
 * Listen for actions that mutate the jane waiting area state
 */
ReducerRegistry.register(
    'features/jane-waiting-area', (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case ADD_JANE_WAITING_AREA_AUDIO_TRACK: {
            return {
                ...state,
                audioTrack: action.value
            };
        }

        case ADD_JANE_WAITING_AREA_CONTENT_SHARING_TRACK: {
            return {
                ...state,
                contentSharingTrack: action.value
            };
        }

        case ADD_JANE_WAITING_AREA_VIDEO_TRACK: {
            return {
                ...state,
                videoTrack: action.value
            };
        }

        case SET_JANE_WAITING_AREA_PAGE_VISIBILITY:
            return {
                ...state,
                showJaneWaitingArea: action.value
            };

        case SET_JANE_WAITING_AREA_VIDEO_DISABLED: {
            return {
                ...state,
                videoDisabled: action.value
            };
        }

        case SET_JANE_WAITING_AREA_VIDEO_MUTED:
            return {
                ...state,
                videoMuted: action.value
            };

        case SET_JANE_WAITING_AREA_AUDIO_MUTED:
            return {
                ...state,
                audioMuted: action.value
            };

        case SET_JANE_WAITING_AREA_DEVICE_ERRORS: {
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

        case SET_JANE_WAITING_AREA_AUDIO_DISABLED: {
            return {
                ...state,
                audioDisabled: true
            };
        }

        case UPDATE_REMOTE_PARTICIPANT_STATUSES: {
            return {
                ...state,
                remoteParticipantsStatuses: action.value
            };
        }

        default:
            return state;
        }
    }
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
                    deviceStatusText: 'janeWaitingArea.audioAndVideoError',
                    rawError: audioAndVideoError.message
                };
            }

            return {
                deviceStatusType: 'warning',
                deviceStatusText: 'janeWaitingArea.audioOnlyError',
                rawError: audioOnlyError.message
            };
        }

        return {
            deviceStatusType: 'warning',
            deviceStatusText: 'janeWaitingArea.videoOnlyError',
            rawError: audioAndVideoError.message
        };
    }

    return {
        deviceStatusType: 'ok',
        deviceStatusText: 'janeWaitingArea.lookGood',
        rawError: ''
    };
}

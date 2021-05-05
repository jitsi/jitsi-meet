import {
    ADD_MODERATED_AUDIO_EXCEPTION,
    ADD_MODERATED_AUDIO_EXCEPTION_FINISH,
    DISABLE_MODERATED_AUDIO,
    DISABLE_MODERATED_AUDIO_FINISH,
    ENABLE_MODERATED_AUDIO,
    ENABLE_MODERATED_AUDIO_FINISH,
    REMOVE_MODERATED_AUDIO_EXCEPTION,
    REMOVE_MODERATED_AUDIO_EXCEPTION_FINISH
} from './constants';

export const addModeratedAudioException = participantId => {
    return {
        type: ADD_MODERATED_AUDIO_EXCEPTION,
        payload: participantId
    };
};

export const addModeratedAudioExceptionFinish = (
        participantId,
        isLocal
) => {
    return {
        type: ADD_MODERATED_AUDIO_EXCEPTION_FINISH,
        payload: {
            isLocal,
            participantId
        }
    };
};

export const disableModeratedAudio = () => {
    return {
        type: DISABLE_MODERATED_AUDIO
    };
};

export const disableModeratedAudioFinish = () => {
    return {
        type: DISABLE_MODERATED_AUDIO_FINISH
    };
};

export const enableModeratedAudio = () => {
    return {
        type: ENABLE_MODERATED_AUDIO
    };
};

export const enableModeratedAudioFinish = () => {
    return {
        type: ENABLE_MODERATED_AUDIO_FINISH
    };
};

export const removeModeratedAudio = participantId => {
    return {
        type: REMOVE_MODERATED_AUDIO_EXCEPTION,
        payload: participantId
    };
};

export const removeModeratedAudioExceptionFinish = (
        participantId,
        isLocal
) => {
    return {
        type: REMOVE_MODERATED_AUDIO_EXCEPTION_FINISH,
        payload: {
            isLocal,
            participantId
        }
    };
};

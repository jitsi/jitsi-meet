// @flow

import { MEDIA_TYPE, type MediaType } from '../base/media/constants';

/**
 * Mapping between a media type and the witelist reducer key.
 */
export const MEDIA_TYPE_TO_WHITELIST_STORE_KEY: {[key: MediaType]: string} = {
    [MEDIA_TYPE.AUDIO]: 'audioWhitelist',
    [MEDIA_TYPE.VIDEO]: 'videoWhitelist'
};

/**
 * Mapping between a media type and the pending reducer key.
 */
export const MEDIA_TYPE_TO_PENDING_STORE_KEY: {[key: MediaType]: string} = {
    [MEDIA_TYPE.AUDIO]: 'pendingAudio',
    [MEDIA_TYPE.VIDEO]: 'pendingVideo'
};

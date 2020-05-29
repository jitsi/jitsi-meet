// @flow

import type { Dispatch } from 'redux';

import { VIDEO_QUALITY_LEVELS } from '../base/conference';

import logger from './logger';


/**
 * Sets the maximum video size the local participant should send and receive from
 * remote participants.
 *
 * @param {number} frameHeight - The user preferred max frame height for send and
 * receive video.
 * @returns {void}
 */
export function setVideoQuality(frameHeight: number) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { conference, maxReceiverVideoQuality } = getState()['features/base/conference'];

        if (frameHeight < VIDEO_QUALITY_LEVELS.LOW) {
            logger.error(`Invalid frame height for video quality - ${frameHeight}`);

            return;
        }
        conference.setReceiverVideoConstraint(Math.min(frameHeight, maxReceiverVideoQuality));
        conference.setSenderVideoConstraint(Math.min(frameHeight, VIDEO_QUALITY_LEVELS.HIGH))
            .catch(err => {
                logger.error(`Set video quality command failed - ${err}`);
            });
    };
}

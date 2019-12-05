// @flow

import JitsiStreamPresenterEffect from './JitsiStreamPresenterEffect';

/**
 * Creates a new instance of JitsiStreamPresenterEffect.
 *
 * @param {MediaStream} stream - The video stream which will be used for
 * creating the presenter effect.
 * @returns {Promise<JitsiStreamPresenterEffect>}
 */
export function createPresenterEffect(stream: MediaStream) {
    if (!MediaStreamTrack.prototype.getSettings
        && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamPresenterEffect not supported!'));
    }

    return Promise.resolve(new JitsiStreamPresenterEffect(stream));
}

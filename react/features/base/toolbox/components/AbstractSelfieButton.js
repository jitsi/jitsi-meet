// @flow

import { IconSelfie } from '../../icons';

import type { Props } from './AbstractButton';
import AbstractButton from './AbstractButton';

/**
 * An abstract implementation of a button for  downloading a selfie.
 */
export default class AbstractSelfieButton<P : Props, S: *>
    extends AbstractButton<P, S> {

    icon = IconSelfie;

    /**
     * Handles clicking / pressing the button, and downloading a selfie.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._downloadSelfie();
        this._downloadAudioRecorder();
        this._downloadVideoRecorder();
    }

    /**
     * Helper function to perform the actual download action.
     *
     * @protected
     * @returns {void}
     */
    _downloadSelfie() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to perform the actual download action.
     *
     * @protected
     * @returns {void}
     */
    _downloadAudioRecorder() {
        // To be implemented by subclass.
    }

    /**
     * Helper function to perform the actual download action.
     *
     * @protected
     * @returns {void}
     */
    _downloadVideoRecorder() {
        // To be implemented by subclass.
    }
}

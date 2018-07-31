// @flow

import React, { Component } from 'react';

import { isFilmstripVisible } from '../../filmstrip';
import { LocalRecordingLabel } from '../../local-recording';
import { RecordingLabel } from '../../recording';
import { VideoQualityLabel } from '../../video-quality';
import { TranscribingLabel } from '../../transcribing/';

/**
 * The type of the React {@code Component} props of {@link AbstractLabels}.
 */
export type Props = {

    /**
    * Whether or not the filmstrip is displayed with remote videos. Used to
    * determine display classes to set.
    */
    _filmstripVisible: boolean,
};

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @extends Component
 */
export default class AbstractLabels<P: Props, S> extends Component<P, S> {
    /**
     * Renders the {@code RecordingLabel} that is platform independent.
     *
     * @protected
     * @param {string} mode - The recording mode that this label is rendered
     * for.
     * @returns {React$Element}
     */
    _renderRecordingLabel(mode: string) {
        return (
            <RecordingLabel mode = { mode } />
        );
    }

    /**
     * Renders the {@code VideoQualityLabel} that is platform independent.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderVideoQualityLabel() {
        return (
            <VideoQualityLabel />
        );
    }

    /**
     * Renders the {@code TranscribingLabel}.
     *
     * @returns {React$Element}
     * @protected
     */
    _renderTranscribingLabel() {
        return (
            <TranscribingLabel />
        );
    }

    /**
     * Renders the {@code LocalRecordingLabel}.
     *
     * @returns {React$Element}
     * @protected
     */
    _renderLocalRecordingLabel() {
        return (
            <LocalRecordingLabel />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Labels} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    return {
        _filmstripVisible: isFilmstripVisible(state)
    };
}

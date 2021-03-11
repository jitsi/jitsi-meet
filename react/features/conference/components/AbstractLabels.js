// @flow

import React, { Component } from 'react';

import { E2EELabel } from '../../e2ee';
import { isFilmstripVisible } from '../../filmstrip';
import { LocalRecordingLabel } from '../../local-recording';
import { RecordingLabel } from '../../recording';
import { TranscribingLabel } from '../../transcribing';
import { shouldDisplayTileView } from '../../video-layout';
import { VideoQualityLabel } from '../../video-quality';

import { InsecureRoomNameLabel } from '.';

/**
 * The type of the React {@code Component} props of {@link AbstractLabels}.
 */
export type Props = {

    /**
     * Whether the filmstrip is displayed with remote videos. Used to determine
     * display classes to set.
     */
    _filmstripVisible: boolean,

    /**
     * Whether the video quality label should be displayed.
     */
    _showVideoQualityLabel: boolean
};

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @extends Component
 */
export default class AbstractLabels<P: Props, S> extends Component<P, S> {
    /**
     * Renders the {@code E2EELabel}.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderE2EELabel() {
        return (
            <E2EELabel />
        );
    }

    /**
     * Renders the {@code LocalRecordingLabel}.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderLocalRecordingLabel() {
        return (
            <LocalRecordingLabel />
        );
    }

    /**
     * Renders the {@code RecordingLabel} that is platform independent.
     *
     * @param {string} mode - The recording mode that this label is rendered
     * for.
     * @protected
     * @returns {React$Element}
     */
    _renderRecordingLabel(mode: string) {
        return (
            <RecordingLabel mode = { mode } />
        );
    }

    /**
     * Renders the {@code TranscribingLabel}.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderTranscribingLabel() {
        return (
            <TranscribingLabel />
        );
    }

    /**
     * Renders the {@code InsecureRoomNameLabel}.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderInsecureRoomNameLabel() {
        return (
            <InsecureRoomNameLabel />
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
}

/**
 * Maps (parts of) the redux state to the associated props of the {@link Labels}
 * {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean,
 *     _showVideoQualityLabel: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    return {
        _filmstripVisible: isFilmstripVisible(state),
        _showVideoQualityLabel: !shouldDisplayTileView(state)
    };
}

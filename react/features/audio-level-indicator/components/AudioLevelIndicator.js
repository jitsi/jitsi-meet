// @flow

import React, { Component } from 'react';

import audioLevelEmitter from '../audioLevelEmitter';
import StatelessAudioLevelIndicator from './StatelessAudioLevelIndicator';

type Props = {
    audioLevelOverride: number,

    userID: string
};

type State = {
    audioLevel: number
};

/**
 * Creates a ReactElement responsible for subscribing to audio level updates and
 * drawing audio levels.
 *
 * @extends {Component}
 */
export default class AudioLevelIndicator extends Component<Props, State> {
    /**
     * Initializes a new {@code AudioLevelIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            audioLevel: 0
        };

        // Bind event handler so it is only bound once for every instance.
        this._onStatsUpdated = this._onStatsUpdated.bind(this);
    }

    /**
     * Starts listening for audio level updates.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        audioLevelEmitter.subscribe(
            this.props.userID, this._onStatsUpdated);
    }

    /**
     * Updates which user's audio levels are being listened to.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        if (prevProps.userID !== this.props.userID) {
            audioLevelEmitter.unsubscribe(
                prevProps.userID, this._onStatsUpdated);
            audioLevelEmitter.subscribe(
                this.props.userID, this._onStatsUpdated);
        }
    }

    /**
     * Cleans up any queued processes, which includes listening for new stats
     * and clearing any timeout to hide the indicator.
     *
     * @private
     * @returns {void}
     */
    componentWillUnmount() {
        audioLevelEmitter.unsubscribe(
            this.props.userID, this._onStatsUpdated);
    }

    /**
     * Renders the {@code StatelessAudioLevelIndicator} with the known audio
     * level.
     *
     * @inheritdoc
     */
    render() {
        return (
            <StatelessAudioLevelIndicator
                audioLevel = { this.props.audioLevelOverride
                    || this.state.audioLevel } />
        );
    }

    _onStatsUpdated: (number) => void;

    /**
     * Callback invoked to update the known audio level.
     *
     * @param {number} audioLevel - The participant's current audio level.
     * @returns {void}
     */
    _onStatsUpdated(audioLevel: number = 0) {
        this.setState({ audioLevel });
    }
}

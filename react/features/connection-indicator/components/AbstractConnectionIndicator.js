// @flow

import { Component } from 'react';

import statsEmitter from '../statsEmitter';

declare var interfaceConfig: Object;

const defaultAutoHideTimeout = 5000;

/**
 * The connection quality percentage that must be reached to be considered of
 * good quality and can result in the connection indicator being hidden.
 *
 * @type {number}
 */
export const INDICATOR_DISPLAY_THRESHOLD = 30;

/**
 * The type of the React {@code Component} props of {@link ConnectionIndicator}.
 */
export type Props = {

    /**
     * How long the connection indicator should remain displayed before hiding.
     */
    _autoHideTimeout: number,

    /**
     * The ID of the participant associated with the displayed connection indication and
     * stats.
     */
    participantId: string
};

/**
 * The type of the React {@code Component} state of {@link ConnectionIndicator}.
 */
export type State = {

    /**
     * Whether or not a CSS class should be applied to the root for hiding the
     * connection indicator. By default the indicator should start out hidden
     * because the current connection status is not known at mount.
     */
    showIndicator: boolean,

    /**
     * Cache of the stats received from subscribing to stats emitting. The keys
     * should be the name of the stat. With each stat update, updates stats are
     * mixed in with cached stats and a new stats object is set in state.
     */
    stats: Object
};

/**
 * Implements a React {@link Component} which displays the current connection
 * quality.
 *
 * @augments {Component}
 */
class AbstractConnectionIndicator<P: Props, S: State> extends Component<P, S> {
    /**
     * The timeout for automatically hiding the indicator.
     */
    autoHideTimeout: ?TimeoutID;

    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {P} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onStatsUpdated = this._onStatsUpdated.bind(this);
    }

    /**
     * Starts listening for stat updates.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        statsEmitter.subscribeToClientStats(
            this.props.participantId, this._onStatsUpdated);
    }

    /**
     * Updates which user's stats are being listened to.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        if (prevProps.participantId !== this.props.participantId) {
            statsEmitter.unsubscribeToClientStats(
                prevProps.participantId, this._onStatsUpdated);
            statsEmitter.subscribeToClientStats(
                this.props.participantId, this._onStatsUpdated);
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
        statsEmitter.unsubscribeToClientStats(
            this.props.participantId, this._onStatsUpdated);

        clearTimeout(this.autoHideTimeout);
    }

    _onStatsUpdated: (Object) => void;

    /**
     * Callback invoked when new connection stats associated with the passed in
     * user ID are available. Will update the component's display of current
     * statistics.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _onStatsUpdated(stats = {}) {
        // Rely on React to batch setState actions.
        const { connectionQuality } = stats;
        const newPercentageState = typeof connectionQuality === 'undefined'
            ? {} : { percent: connectionQuality };
        const newStats = Object.assign(
            {},
            this.state.stats,
            stats,
            newPercentageState);

        this.setState({
            stats: newStats
        });

        this._updateIndicatorAutoHide(newStats.percent);
    }

    /**
     * Updates the internal state for automatically hiding the indicator.
     *
     * @param {number} percent - The current connection quality percentage
     * between the values 0 and 100.
     * @private
     * @returns {void}
     */
    _updateIndicatorAutoHide(percent) {
        if (percent < INDICATOR_DISPLAY_THRESHOLD) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = undefined;

            this.setState({
                showIndicator: true
            });
        } else if (this.autoHideTimeout) {
            // This clause is intentionally left blank because no further action
            // is needed if the percent is below the threshold and there is an
            // autoHideTimeout set.
        } else {
            this.autoHideTimeout = setTimeout(() => {
                this.setState({
                    showIndicator: false
                });
            }, this.props._autoHideTimeout);
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code ConnectorIndicator} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: Object) {
    return {
        _autoHideTimeout: state['features/base/config'].connectionIndicators.autoHideTimeout ?? defaultAutoHideTimeout
    };
}

export default AbstractConnectionIndicator;

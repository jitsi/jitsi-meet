import ConnectionIcon from '@atlaskit/icon/glyph/vid-connection-circle';
import React, { Component } from 'react';

import { JitsiParticipantConnectionStatus } from '../../base/lib-jitsi-meet';
import { Popover } from '../../base/popover';
import { ConnectionStatsTable } from '../../connection-stats';

import statsEmitter from '../statsEmitter';

declare var interfaceConfig: Object;

/**
 * The connection quality percentage that must be reached to be considered
 * of good quality and can result in the connection indicator being hidden.
 *
 * @type {number}
 */
const INDICATOR_DISPLAY_THRESHOLD = 64;

/**
 * A map of connection quality percentages and corresponding colors to display
 * when the current connection quality meets or exceeds the percentage.
 *
 * @type {Object}
 */
const CONNECTION_TO_COLOR_MAP = {
    0: 'crimson',
    30: 'indianred',
    47: 'yellow',
    [INDICATOR_DISPLAY_THRESHOLD]: 'greenyellow',
    81: 'lawngreen',
    98: 'springgreen'
};

/**
 * The connection quality percentages from {@code CONNECTION_TO_COLOR_MAP},
 * ordered from biggest to smallest.
 *
 * @type {Number[]}
 */
const PERCENTAGE_THRESHOLDS
    = Object.keys(CONNECTION_TO_COLOR_MAP)
        .map(percentage => Number(percentage))
        .sort((a, b) => a - b)
        .reverse();

/**
 * Implements a React {@link Component} which displays the current connection
 * quality percentage and has a popover to show more detailed connection stats.
 *
 * @extends {Component}
 */
class ConnectionIndicator extends Component {
    /**
     * {@code ConnectionIndicator} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The current condition of the user's connection, matching one of the
         * enumerated values in the library.
         *
         * @type {JitsiParticipantConnectionStatus}
         */
        connectionStatus: React.PropTypes.string,

        /**
         * Whether or not clicking the indicator should display a popover for
         * more details.
         */
        enableStatsDisplay: React.PropTypes.bool,

        /**
         * Whether or not the displays stats are for local video.
         */
        isLocalVideo: React.PropTypes.bool,

        /**
         * Relative to the icon from where the popover for more connection
         * details should display.
         */
        statsPopoverPosition: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func,

        /**
         * The user ID associated with the displayed connection indication and
         * stats.
         */
        userID: React.PropTypes.string
    };

    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * The timeout for automatically hiding the indicator.
             *
             * @type {timeoutID}
             */
            autohideTimeout: null,

            /**
             * Whether or not a CSS class should be applied to the root for
             * hiding the connection indicator.
             *
             * @type {boolean}
             */
            hideIndicator: false,

            /**
             * Whether or not the popover content should display additional
             * statistics.
             *
             * @type {boolean}
             */
            showMoreStats: false,

            /**
             * Cache of the stats received from subscribing to stats emitting.
             * The keys should be the name of the stat. With each stat update,
             * updates stats are mixed in with cached stats and a new stats
             * object is set in state.
             */
            stats: {}
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onStatsUpdated = this._onStatsUpdated.bind(this);
        this._onToggleShowMore = this._onToggleShowMore.bind(this);
    }

    /**
     * Starts listening for stat updates.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        this._updateIndicatorAutohide();

        statsEmitter.subscribeToClientStats(
            this.props.userID, this._onStatsUpdated);
    }

    /**
     * Updates which user's stats are being listened to.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps) {
        if (prevProps.userID !== this.props.userID) {
            statsEmitter.unsubscribeToClientStats(
                prevProps.userID, this._onStatsUpdated);
            statsEmitter.subscribeToClientStats(
                this.props.userID, this._onStatsUpdated);
        }
    }

    /**
     * Sets the state to hide the Statistics Table popover.
     *
     * @private
     * @returns {void}
     */
    componentWillUnmount() {
        statsEmitter.unsubscribeToClientStats(
            this.props.userID, this._onStatsUpdated);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const className = `indicator-container ${
            this._getIndicatorVisibilityClass()}`;

        return (
            <Popover
                className = { className }
                content = { this._renderStatisticsTable() }
                position = { this.props.statsPopoverPosition }>
                <div className = 'popover-trigger'>
                    <div className = 'connection-indicator indicator'>
                        <div className = 'connection indicatoricon'>
                            { this._renderIcon() }
                        </div>
                    </div>
                </div>
            </Popover>
        );
    }

    /**
     * Matches the connection quality percentage to a configured color. If no
     * strength is passed in, then by default the color matched to 100% will be
     * returned.
     *
     * @param {number} percent - A number between 0 and 100 to match with a
     * connection strength color.
     * @private
     * @returns {string}
     */
    _getIndicatorColor(percent = 100) {
        const matchingThreshold
            = PERCENTAGE_THRESHOLDS.find(threshold => percent >= threshold);

        return CONNECTION_TO_COLOR_MAP[matchingThreshold];
    }

    /**
     * Returns additional class names to add to the root of the component. The
     * class names are intended to be used for hiding or showing the indicator.
     *
     * @private
     * @returns {string}
     */
    _getIndicatorVisibilityClass() {
        const { connectionStatus } = this.props;

        return !interfaceConfig.CONNECTION_INDICATOR_AUTOHIDE_ENABLED
            || !this.state.hideIndicator
            || connectionStatus === JitsiParticipantConnectionStatus.INTERRUPTED
            || connectionStatus === JitsiParticipantConnectionStatus.INACTIVE
            ? 'show-indicator' : 'hide-indicator';
    }

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

        // Rely on React to batch setState actions.
        this._updateIndicatorAutohide(newStats.percent);
    }

    /**
     * Callback to invoke when the show more link in the popover content is
     * clicked. Sets the state which will determine if the popover should show
     * additional statistics about the connection.
     *
     * @returns {void}
     */
    _onToggleShowMore() {
        this.setState({ showMoreStats: !this.state.showMoreStats });
    }

    /**
     * Creates a ReactElement for displaying an icon that represents the current
     * connection quality.
     *
     * @returns {ReactElement}
     */
    _renderIcon() {
        switch (this.props.connectionStatus) {
        case JitsiParticipantConnectionStatus.INTERRUPTED:
            return (
                <span className = 'connection_lost'>
                    <i className = 'icon-connection-lost' />
                </span>
            );

        case JitsiParticipantConnectionStatus.INACTIVE:
            return (
                <span className = 'connection_ninja'>
                    <i className = 'icon-ninja' />
                </span>
            );

        default: {
            const { percent } = this.state.stats;

            // The primaryColor prop is not set for ConnectionIcon so the icon's
            // background can blend in with the icon's parent.
            return (
                <span className = 'connection_bars'>
                    <ConnectionIcon
                        label = 'connection'
                        secondaryColor = { this._getIndicatorColor(percent) }
                        size = 'small' />
                </span>
            );
        }
        }
    }

    /**
     * Creates a {@code ConnectionStatisticsTable} instance.
     *
     * @returns {ReactElement}
     */
    _renderStatisticsTable() {
        const {
            bandwidth,
            bitrate,
            framerate,
            packetLoss,
            resolution,
            transport
        } = this.state.stats;

        return (
            <ConnectionStatsTable
                bandwidth = { bandwidth }
                bitrate = { bitrate }
                framerate = { framerate }
                isLocalVideo = { this.props.isLocalVideo }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                resolution = { resolution }
                shouldShowMore = { this.state.showMoreStats }
                transport = { transport } />
        );
    }

    /**
     * Updates the internal state for automatically hiding the indicator. If
     * undefined is passed in for the connection strength percent then the
     * indicator will be queued for hiding.
     *
     * @param {number|undefined} percent - The current connection quality
     * percentage, between the values 0 and 100.
     * @private
     * @returns {void}
     */
    _updateIndicatorAutohide(percent) {
        if (!interfaceConfig.CONNECTION_INDICATOR_AUTOHIDE_ENABLED) {
            return;
        }

        if (percent < INDICATOR_DISPLAY_THRESHOLD) {
            clearTimeout(this.state.autohideTimeout);
            this.setState({
                autohideTimeout: null,
                hideIndicator: false
            });
        } else if (!this.state.autohideTimeout || !percent) {
            this.setState({
                autohideTimeout: setTimeout(() => {
                    this.setState({
                        hideIndicator: true
                    });
                }, interfaceConfig.CONNECTION_INDICATOR_HIDE_TIMEOUT)
            });
        }
    }
}

export default ConnectionIndicator;

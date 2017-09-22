import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { JitsiParticipantConnectionStatus } from '../../base/lib-jitsi-meet';
import { Popover } from '../../base/popover';
import { ConnectionStatsTable } from '../../connection-stats';

import statsEmitter from '../statsEmitter';

declare var $: Object;
declare var interfaceConfig: Object;

// Converts the percent for connection quality into a string recognized for CSS.
const QUALITY_TO_WIDTH = [

    // Full (5 bars)
    {
        colorClass: 'status-high',
        percent: 80,
        tip: 'connectionindicator.quality.strong',
        width: '100%'
    },

    // 4 bars
    {
        colorClass: 'status-med',
        percent: 60,
        tip: 'connectionindicator.quality.good',
        width: '80%'
    },

    // 3 bars
    {
        colorClass: 'status-med',
        percent: 40,
        tip: 'connectionindicator.quality.unstable',
        width: '55%'
    },

    // 2 bars
    {
        colorClass: 'status-low',
        percent: 20,
        tip: 'connectionindicator.quality.weak',
        width: '40%'
    },

    // 1 bar
    {
        colorClass: 'status-low',
        percent: 0,
        tip: 'connectionindicator.quality.weak',
        width: '20%'
    }

    // Note: we never show 0 bars.
];

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
        connectionStatus: PropTypes.string,

        /**
         * Whether or not clicking the indicator should display a popover for
         * more details.
         */
        enableStatsDisplay: PropTypes.bool,

        /**
         * Whether or not the displays stats are for local video.
         */
        isLocalVideo: PropTypes.bool,

        /**
         * Relative to the icon from where the popover for more connection
         * details should display.
         */
        statsPopoverPosition: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * The user ID associated with the displayed connection indication and
         * stats.
         */
        userID: PropTypes.string
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
        const indicatorContainerClassName = `connection-indicator indicator ${
            this._getConnectionColorClass()}`;

        return (
            <Popover
                className = 'indicator-container'
                content = { this._renderStatisticsTable() }
                position = { this.props.statsPopoverPosition }>
                <div className = 'popover-trigger'>
                    <div className = { indicatorContainerClassName }>
                        <div className = 'connection indicatoricon'>
                            { this._renderIcon() }
                        </div>
                    </div>
                </div>
            </Popover>
        );
    }

    /**
     * Returns a CSS class that interprets the current connection status as a
     * color.
     *
     * @private
     * @returns {string}
     */
    _getConnectionColorClass() {
        const { connectionStatus } = this.props;
        const { percent } = this.state.stats;
        const { INACTIVE, INTERRUPTED } = JitsiParticipantConnectionStatus;

        if (connectionStatus === INACTIVE) {
            return 'status-other';
        } else if (connectionStatus === INTERRUPTED) {
            return 'status-low';
        } else if (typeof percent === 'undefined') {
            return 'status-high';
        }

        return QUALITY_TO_WIDTH.find(x => percent >= x.percent).colorClass;
    }

    /**
     * Returns a string that describes the current connection status.
     *
     * @private
     * @returns {string}
     */
    _getConnectionStatusTip() {
        let tipKey;

        switch (this.props.connectionStatus) {
        case JitsiParticipantConnectionStatus.INTERRUPTED:
            tipKey = 'connectionindicator.quality.interrupted';
            break;

        case JitsiParticipantConnectionStatus.INACTIVE:
            tipKey = 'connectionindicator.quality.inactive';
            break;

        default: {
            const { percent } = this.state.stats;

            if (typeof percent === 'undefined') {
                // If percentage is undefined then there are no stats available
                // yet, likely because only a local connection has been
                // established so far. Assume a strong connection to start.
                tipKey = 'connectionindicator.quality.strong';
            } else {
                const config = QUALITY_TO_WIDTH.find(x => percent >= x.percent);

                tipKey = config.tip;
            }
        }
        }

        return this.props.t(tipKey);
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
        if (this.props.connectionStatus
            === JitsiParticipantConnectionStatus.INACTIVE) {
            return (
                <span className = 'connection_ninja'>
                    <i className = 'icon-ninja' />
                </span>
            );
        }

        let iconWidth;

        if (this.props.connectionStatus
            === JitsiParticipantConnectionStatus.INTERRUPTED) {
            iconWidth = '0%';
        } else if (typeof this.state.stats.percent === 'undefined') {
            iconWidth = '100%';
        } else {
            const { percent } = this.state.stats;

            iconWidth = QUALITY_TO_WIDTH.find(x => percent >= x.percent).width;
        }

        return [
            <span
                className = 'connection_empty'
                key = 'icon-empty'>
                <i className = 'icon-connection' />
            </span>,
            <span
                className = 'connection_full'
                key = 'icon-full'
                style = {{ width: iconWidth }}>
                <i className = 'icon-connection' />
            </span>
        ];
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
                connectionSummary = { this._getConnectionStatusTip() }
                framerate = { framerate }
                isLocalVideo = { this.props.isLocalVideo }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                resolution = { resolution }
                shouldShowMore = { this.state.showMoreStats }
                transport = { transport } />
        );
    }
}

export default translate(ConnectionIndicator);

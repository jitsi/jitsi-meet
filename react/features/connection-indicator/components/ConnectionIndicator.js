/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { JitsiParticipantConnectionStatus } from '../../base/lib-jitsi-meet';
import { Popover } from '../../base/popover';
import { ConnectionStatsTable } from '../../connection-stats';

import statsEmitter from '../statsEmitter';

declare var interfaceConfig: Object;

/**
 * The connection quality percentage that must be reached to be considered of
 * good quality and can result in the connection indicator being hidden.
 *
 * @type {number}
 */
const INDICATOR_DISPLAY_THRESHOLD = 30;

/**
 * An array of display configurations for the connection indicator and its bars.
 * The ordering is done specifically for faster iteration to find a matching
 * configuration to the current connection strength percentage.
 *
 * @type {Object[]}
 */
const QUALITY_TO_WIDTH: Array<Object> = [

    // Full (3 bars)
    {
        colorClass: 'status-high',
        percent: INDICATOR_DISPLAY_THRESHOLD,
        tip: 'connectionindicator.quality.good',
        width: '100%'
    },

    // 2 bars
    {
        colorClass: 'status-med',
        percent: 10,
        tip: 'connectionindicator.quality.nonoptimal',
        width: '66%'
    },

    // 1 bar
    {
        colorClass: 'status-low',
        percent: 0,
        tip: 'connectionindicator.quality.poor',
        width: '33%'
    }

    // Note: we never show 0 bars as long as there is a connection.
];

/**
 * The type of the React {@code Component} props of {@link ConnectionIndicator}.
 */
type Props = {

    /**
     * Whether or not the component should ignore setting a visibility class for
     * hiding the component when the connection quality is not strong.
     */
    alwaysVisible: boolean,

    /**
     * The current condition of the user's connection, matching one of the
     * enumerated values in the library.
     */
    connectionStatus: string,

    /**
     * Whether or not clicking the indicator should display a popover for more
     * details.
     */
    enableStatsDisplay: boolean,

    /**
     * The font-size for the icon.
     */
    iconSize: number,

    /**
     * Whether or not the displays stats are for local video.
     */
    isLocalVideo: boolean,

    /**
     * Relative to the icon from where the popover for more connection details
     * should display.
     */
    statsPopoverPosition: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The user ID associated with the displayed connection indication and
     * stats.
     */
    userID: string
};

/**
 * The type of the React {@code Component} state of {@link ConnectionIndicator}.
 */
type State = {

    /**
     * The timeout for automatically hiding the indicator.
     */
    autoHideTimeout: TimeoutID | null,

    /**
     * Whether or not a CSS class should be applied to the root for hiding the
     * connection indicator. By default the indicator should start out hidden
     * because the current connection status is not known at mount.
     */
    showIndicator: boolean,

    /**
     * Whether or not the popover content should display additional statistics.
     */
    showMoreStats: boolean,

    /**
     * Cache of the stats received from subscribing to stats emitting. The keys
     * should be the name of the stat. With each stat update, updates stats are
     * mixed in with cached stats and a new stats object is set in state.
     */
    stats: Object
};

/**
 * Implements a React {@link Component} which displays the current connection
 * quality percentage and has a popover to show more detailed connection stats.
 *
 * @extends {Component}
 */
class ConnectionIndicator extends Component<Props, State> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            autoHideTimeout: null,
            showIndicator: false,
            showMoreStats: false,
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
     * Cleans up any queued processes, which includes listening for new stats
     * and clearing any timeout to hide the indicator.
     *
     * @private
     * @returns {void}
     */
    componentWillUnmount() {
        statsEmitter.unsubscribeToClientStats(
            this.props.userID, this._onStatsUpdated);

        if (this.state.autoHideTimeout) {
            clearTimeout(this.state.autoHideTimeout);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const visibilityClass = this._getVisibilityClass();
        const rootClassNames = `indicator-container ${visibilityClass}`;

        const colorClass = this._getConnectionColorClass();
        const indicatorContainerClassNames
            = `connection-indicator indicator ${colorClass}`;

        return (
            <Popover
                className = { rootClassNames }
                content = { this._renderStatisticsTable() }
                disablePopover = { !this.props.enableStatsDisplay }
                position = { this.props.statsPopoverPosition }>
                <div className = 'popover-trigger'>
                    <div
                        className = { indicatorContainerClassNames }
                        style = {{ fontSize: this.props.iconSize }}>
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
            return 'status-lost';
        } else if (typeof percent === 'undefined') {
            return 'status-high';
        }

        return this._getDisplayConfiguration(percent).colorClass;
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
            tipKey = 'connectionindicator.quality.lost';
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
                tipKey = 'connectionindicator.quality.good';
            } else {
                const config = this._getDisplayConfiguration(percent);

                tipKey = config.tip;
            }
        }
        }

        return this.props.t(tipKey);
    }

    /**
     * Get the icon configuration from QUALITY_TO_WIDTH which has a percentage
     * that matches or exceeds the passed in percentage. The implementation
     * assumes QUALITY_TO_WIDTH is already sorted by highest to lowest
     * percentage.
     *
     * @param {number} percent - The connection percentage, out of 100, to find
     * the closest matching configuration for.
     * @private
     * @returns {Object}
     */
    _getDisplayConfiguration(percent: number): Object {
        return QUALITY_TO_WIDTH.find(x => percent >= x.percent) || {};
    }

    /**
     * Returns additional class names to add to the root of the component. The
     * class names are intended to be used for hiding or showing the indicator.
     *
     * @private
     * @returns {string}
     */
    _getVisibilityClass() {
        const { connectionStatus } = this.props;

        return this.state.showIndicator
            || this.props.alwaysVisible
            || connectionStatus === JitsiParticipantConnectionStatus.INTERRUPTED
            || connectionStatus === JitsiParticipantConnectionStatus.INACTIVE
            ? 'show-connection-indicator' : 'hide-connection-indicator';
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

    _onToggleShowMore: () => void;

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
        let emptyIconWrapperClassName = 'connection_empty';

        if (this.props.connectionStatus
            === JitsiParticipantConnectionStatus.INTERRUPTED) {

            // emptyIconWrapperClassName is used by the torture tests to
            // identify lost connection status handling.
            emptyIconWrapperClassName = 'connection_lost';
            iconWidth = '0%';
        } else if (typeof this.state.stats.percent === 'undefined') {
            iconWidth = '100%';
        } else {
            const { percent } = this.state.stats;

            iconWidth = this._getDisplayConfiguration(percent).width;
        }

        return [
            <span
                className = { emptyIconWrapperClassName }
                key = 'icon-empty'>
                <i className = 'icon-gsm-bars' />
            </span>,
            <span
                className = 'connection_full'
                key = 'icon-full'
                style = {{ width: iconWidth }}>
                <i className = 'icon-gsm-bars' />
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
            bridgeCount,
            e2eRtt,
            framerate,
            packetLoss,
            region,
            resolution,
            serverRegion,
            transport
        } = this.state.stats;

        return (
            <ConnectionStatsTable
                bandwidth = { bandwidth }
                bitrate = { bitrate }
                bridgeCount = { bridgeCount }
                connectionSummary = { this._getConnectionStatusTip() }
                e2eRtt = { e2eRtt }
                framerate = { framerate }
                isLocalVideo = { this.props.isLocalVideo }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                region = { region }
                resolution = { resolution }
                serverRegion = { serverRegion }
                shouldShowMore = { this.state.showMoreStats }
                transport = { transport } />
        );
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
            if (this.state.autoHideTimeout) {
                clearTimeout(this.state.autoHideTimeout);
            }

            this.setState({
                autoHideTimeout: null,
                showIndicator: true
            });
        } else if (this.state.autoHideTimeout) {
            // This clause is intentionally left blank because no further action
            // is needed if the percent is below the threshold and there is an
            // autoHideTimeout set.
        } else {
            this.setState({
                autoHideTimeout: setTimeout(() => {
                    this.setState({
                        showIndicator: false
                    });
                }, interfaceConfig.CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT)
            });
        }
    }
}

export default translate(ConnectionIndicator);

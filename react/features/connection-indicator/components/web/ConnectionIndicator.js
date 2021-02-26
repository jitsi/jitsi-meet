// @flow

import React from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { Icon, IconConnectionActive, IconConnectionInactive } from '../../../base/icons';
import { JitsiParticipantConnectionStatus } from '../../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../../base/media';
import { getLocalParticipant, getParticipantById } from '../../../base/participants';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { getTrackByMediaTypeAndParticipant } from '../../../base/tracks';
import { ConnectionStatsTable } from '../../../connection-stats';
import { saveLogs } from '../../actions';
import AbstractConnectionIndicator, {
    INDICATOR_DISPLAY_THRESHOLD,
    type Props as AbstractProps,
    type State as AbstractState
} from '../AbstractConnectionIndicator';

declare var interfaceConfig: Object;

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
type Props = AbstractProps & {

    /**
     * The current condition of the user's connection, matching one of the
     * enumerated values in the library.
     */
    _connectionStatus: string,

    /**
     * Whether or not the component should ignore setting a visibility class for
     * hiding the component when the connection quality is not strong.
     */
    alwaysVisible: boolean,

    /**
     * The audio SSRC of this client.
     */
    audioSsrc: number,

    /**
     * The Redux dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * Whether or not should display the "Save Logs" link in the local video
     * stats table.
     */
    enableSaveLogs: boolean,

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
     * The video SSRC of this client.
     */
    videoSsrc: number,

    /**
     * Invoked to save the conference logs.
     */
    _onSaveLogs: Function
};

/**
 * The type of the React {@code Component} state of {@link ConnectionIndicator}.
 */
type State = AbstractState & {

    /**
     * Whether or not the popover content should display additional statistics.
     */
    showMoreStats: boolean
};

/**
 * Implements a React {@link Component} which displays the current connection
 * quality percentage and has a popover to show more detailed connection stats.
 *
 * @extends {Component}
 */
class ConnectionIndicator extends AbstractConnectionIndicator<Props, State> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            autoHideTimeout: undefined,
            showIndicator: false,
            showMoreStats: false,
            stats: {}
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onToggleShowMore = this._onToggleShowMore.bind(this);
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
        const { _connectionStatus } = this.props;
        const { percent } = this.state.stats;
        const { INACTIVE, INTERRUPTED } = JitsiParticipantConnectionStatus;

        if (_connectionStatus === INACTIVE) {
            return 'status-other';
        } else if (_connectionStatus === INTERRUPTED) {
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

        switch (this.props._connectionStatus) {
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
        const { _connectionStatus } = this.props;

        return this.state.showIndicator
            || this.props.alwaysVisible
            || _connectionStatus === JitsiParticipantConnectionStatus.INTERRUPTED
            || _connectionStatus === JitsiParticipantConnectionStatus.INACTIVE
            ? 'show-connection-indicator' : 'hide-connection-indicator';
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
        if (this.props._connectionStatus
            === JitsiParticipantConnectionStatus.INACTIVE) {
            return (
                <span className = 'connection_ninja'>
                    <Icon
                        className = 'icon-ninja'
                        size = '1.5em'
                        src = { IconConnectionInactive } />
                </span>
            );
        }

        let iconWidth;
        let emptyIconWrapperClassName = 'connection_empty';

        if (this.props._connectionStatus
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
                <Icon
                    className = 'icon-gsm-bars'
                    size = '1em'
                    src = { IconConnectionActive } />
            </span>,
            <span
                className = 'connection_full'
                key = 'icon-full'
                style = {{ width: iconWidth }}>
                <Icon
                    className = 'icon-gsm-bars'
                    size = '1em'
                    src = { IconConnectionActive } />
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
            codec,
            e2eRtt,
            framerate,
            maxEnabledResolution,
            packetLoss,
            region,
            resolution,
            serverRegion,
            transport
        } = this.state.stats;

        return (
            <ConnectionStatsTable
                audioSsrc = { this.props.audioSsrc }
                bandwidth = { bandwidth }
                bitrate = { bitrate }
                bridgeCount = { bridgeCount }
                codec = { codec }
                connectionSummary = { this._getConnectionStatusTip() }
                e2eRtt = { e2eRtt }
                enableSaveLogs = { this.props.enableSaveLogs }
                framerate = { framerate }
                isLocalVideo = { this.props.isLocalVideo }
                maxEnabledResolution = { maxEnabledResolution }
                onSaveLogs = { this.props._onSaveLogs }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                participantId = { this.props.participantId }
                region = { region }
                resolution = { resolution }
                serverRegion = { serverRegion }
                shouldShowMore = { this.state.showMoreStats }
                transport = { transport }
                videoSsrc = { this.props.videoSsrc } />
        );
    }
}


/**
 * Maps redux actions to the props of the component.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _onSaveLogs: Function,
 * }}
 * @private
 */
export function _mapDispatchToProps(dispatch: Dispatch<any>) {
    return {
        /**
         * Saves the conference logs.
         *
         * @returns {Function}
         */
        _onSaveLogs() {
            dispatch(saveLogs());
        }
    };
}


/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { participantId } = ownProps;
    const conference = state['features/base/conference'].conference;
    const participant
        = typeof participantId === 'undefined' ? getLocalParticipant(state) : getParticipantById(state, participantId);
    const props = {
        _connectionStatus: participant?.connectionStatus,
        enableSaveLogs: state['features/base/config'].enableSaveLogs
    };

    if (conference) {
        const firstVideoTrack = getTrackByMediaTypeAndParticipant(
            state['features/base/tracks'], MEDIA_TYPE.VIDEO, participantId);
        const firstAudioTrack = getTrackByMediaTypeAndParticipant(
            state['features/base/tracks'], MEDIA_TYPE.AUDIO, participantId);

        return {
            ...props,
            audioSsrc: firstAudioTrack ? conference.getSsrcByTrack(firstAudioTrack.jitsiTrack) : undefined,
            videoSsrc: firstVideoTrack ? conference.getSsrcByTrack(firstVideoTrack.jitsiTrack) : undefined
        };
    }

    return {
        ...props
    };
}
export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ConnectionIndicator));

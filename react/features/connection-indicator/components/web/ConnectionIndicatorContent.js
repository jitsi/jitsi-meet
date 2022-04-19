// @flow

import React from 'react';
import type { Dispatch } from 'redux';

import { getSourceNameSignalingFeatureFlag } from '../../../base/config';
import { translate } from '../../../base/i18n';
import { MEDIA_TYPE } from '../../../base/media';
import { getLocalParticipant, getParticipantById } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { getTrackByMediaTypeAndParticipant } from '../../../base/tracks';
import { ConnectionStatsTable } from '../../../connection-stats';
import { saveLogs } from '../../actions';
import {
    isParticipantConnectionStatusInactive,
    isParticipantConnectionStatusInterrupted,
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted
} from '../../functions';
import AbstractConnectionIndicator, {
    INDICATOR_DISPLAY_THRESHOLD,
    type Props as AbstractProps,
    type State as AbstractState
} from '../AbstractConnectionIndicator';

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
     * The audio SSRC of this client.
     */
     _audioSsrc: number,

    /**
     * The current condition of the user's connection, matching one of the
     * enumerated values in the library.
     */
    _connectionStatus: string,

    /**
     * Whether or not should display the "Show More" link in the local video
     * stats table.
     */
    _disableShowMoreStats: boolean,

    /**
     * Whether or not should display the "Save Logs" link in the local video
     * stats table.
     */
    _enableSaveLogs: boolean,

    /**
     * Whether or not the displays stats are for screen share. This prop is behind the sourceNameSignaling feature
     * flag.
     */
    _isFakeScreenShareParticipant: Boolean,

    /**
     * Whether or not the displays stats are for local video.
     */
    _isLocalVideo: boolean,

    /**
     * Invoked to save the conference logs.
     */
    _onSaveLogs: Function,

    /**
     * The region reported by the participant.
     */
    _region: String,

    /**
     * The video SSRC of this client.
     */
    _videoSsrc: number,

    /**
     * Css class to apply on container.
     */
    className: string,

    /**
     * The Redux dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * Optional param for passing existing connection stats on component instantiation.
     */
    inheritedStats: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
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
 * @augments {Component}
 */
class ConnectionIndicatorContent extends AbstractConnectionIndicator<Props, State> {
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
            stats: props.inheritedStats || {}
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
        const {
            bandwidth,
            bitrate,
            bridgeCount,
            codec,
            e2eRtt,
            framerate,
            maxEnabledResolution,
            packetLoss,
            resolution,
            serverRegion,
            transport
        } = this.state.stats;

        return (
            <ConnectionStatsTable
                audioSsrc = { this.props._audioSsrc }
                bandwidth = { bandwidth }
                bitrate = { bitrate }
                bridgeCount = { bridgeCount }
                codec = { codec }
                connectionSummary = { this._getConnectionStatusTip() }
                disableShowMoreStats = { this.props._disableShowMoreStats }
                e2eRtt = { e2eRtt }
                enableSaveLogs = { this.props._enableSaveLogs }
                framerate = { framerate }
                isFakeScreenShareParticipant = { this.props._isFakeScreenShareParticipant }
                isLocalVideo = { this.props._isLocalVideo }
                maxEnabledResolution = { maxEnabledResolution }
                onSaveLogs = { this.props._onSaveLogs }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                participantId = { this.props.participantId }
                region = { this.props._region }
                resolution = { resolution }
                serverRegion = { serverRegion }
                shouldShowMore = { this.state.showMoreStats }
                transport = { transport }
                videoSsrc = { this.props._videoSsrc } />
        );
    }

    /**
     * Returns a string that describes the current connection status.
     *
     * @private
     * @returns {string}
     */
    _getConnectionStatusTip() {
        let tipKey;

        const { _isConnectionStatusInactive, _isConnectionStatusInterrupted } = this.props;

        switch (true) {
        case _isConnectionStatusInterrupted:
            tipKey = 'connectionindicator.quality.lost';
            break;

        case _isConnectionStatusInactive:
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
        = participantId ? getParticipantById(state, participantId) : getLocalParticipant(state);
    const firstVideoTrack = getTrackByMediaTypeAndParticipant(
        state['features/base/tracks'], MEDIA_TYPE.VIDEO, participantId);
    const sourceNameSignalingEnabled = getSourceNameSignalingFeatureFlag(state);

    const _isConnectionStatusInactive = sourceNameSignalingEnabled
        ? isTrackStreamingStatusInactive(firstVideoTrack)
        : isParticipantConnectionStatusInactive(participant);

    const _isConnectionStatusInterrupted = sourceNameSignalingEnabled
        ? isTrackStreamingStatusInterrupted(firstVideoTrack)
        : isParticipantConnectionStatusInterrupted(participant);

    const props = {
        _connectionStatus: participant?.connectionStatus,
        _enableSaveLogs: state['features/base/config'].enableSaveLogs,
        _disableShowMoreStats: state['features/base/config'].disableShowMoreStats,
        _isConnectionStatusInactive,
        _isConnectionStatusInterrupted,
        _isFakeScreenShareParticipant: sourceNameSignalingEnabled && participant?.isFakeScreenShareParticipant,
        _isLocalVideo: participant?.local,
        _region: participant?.region
    };

    if (conference) {
        const firstAudioTrack = getTrackByMediaTypeAndParticipant(
            state['features/base/tracks'], MEDIA_TYPE.AUDIO, participantId);

        return {
            ...props,
            _audioSsrc: firstAudioTrack ? conference.getSsrcByTrack(firstAudioTrack.jitsiTrack) : undefined,
            _videoSsrc: firstVideoTrack ? conference.getSsrcByTrack(firstVideoTrack.jitsiTrack) : undefined
        };
    }

    return props;
}
export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ConnectionIndicatorContent));

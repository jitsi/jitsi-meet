import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getLocalParticipant,
    getParticipantById,
    isScreenShareParticipant
} from '../../../base/participants/functions';
import {
    getTrackByMediaTypeAndParticipant,
    getVirtualScreenshareParticipantTrack
} from '../../../base/tracks/functions.web';
import ConnectionStatsTable from '../../../connection-stats/components/ConnectionStatsTable';
import { saveLogs } from '../../actions.web';
import {
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted
} from '../../functions';
import AbstractConnectionIndicator, {
    IProps as AbstractProps,
    IState as AbstractState,
    INDICATOR_DISPLAY_THRESHOLD
} from '../AbstractConnectionIndicator';

import BandwidthSettingsDialog from './BandwidthSettingsDialog';

/**
 * An array of display configurations for the connection indicator and its bars.
 * The ordering is done specifically for faster iteration to find a matching
 * configuration to the current connection strength percentage.
 *
 * @type {Object[]}
 */
const QUALITY_TO_WIDTH = [

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
interface IProps extends AbstractProps, WithTranslation {

    /**
     * The audio SSRC of this client.
     */
    _audioSsrc: number;

    /**
     * Whether or not should display the "Show More" link in the local video
     * stats table.
     */
    _disableShowMoreStats: boolean;

    /**
     * Whether to enable assumed bandwidth.
     */
    _enableAssumedBandwidth?: boolean;

    /**
     * Whether or not should display the "Save Logs" link in the local video
     * stats table.
     */
    _enableSaveLogs: boolean;

    _isConnectionStatusInactive: boolean;

    _isConnectionStatusInterrupted: boolean;

    _isE2EEVerified?: boolean;

    /**
     * Whether or not the displays stats are for local video.
     */
    _isLocalVideo: boolean;

    /**
     * Whether is narrow layout or not.
     */
    _isNarrowLayout: boolean;

    /**
     * Invoked to open the bandwidth settings dialog.
     */
    _onOpenBandwidthDialog: () => void;

    /**
     * Invoked to save the conference logs.
     */
    _onSaveLogs: () => void;

    /**
     * The region reported by the participant.
     */
    _region?: string;

    /**
     * The video SSRC of this client.
     */
    _videoSsrc: number;

    /**
     * Css class to apply on container.
     */
    className: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Optional param for passing existing connection stats on component instantiation.
     */
    inheritedStats: any;
}

/**
 * The type of the React {@code Component} state of {@link ConnectionIndicator}.
 */
interface IState extends AbstractState {

    autoHideTimeout?: number;

    /**
     * Whether or not the popover content should display additional statistics.
     */
    showMoreStats: boolean;
}

/**
 * Implements a React {@link Component} which displays the current connection
 * quality percentage and has a popover to show more detailed connection stats.
 *
 * @augments {Component}
 */
class ConnectionIndicatorContent extends AbstractConnectionIndicator<IProps, IState> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
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
    override render() {
        const {
            bandwidth,
            bitrate,
            bridgeCount,
            codec,
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
                e2eeVerified = { this.props._isE2EEVerified }
                enableAssumedBandwidth = { this.props._enableAssumedBandwidth }
                enableSaveLogs = { this.props._enableSaveLogs }
                framerate = { framerate }
                isLocalVideo = { this.props._isLocalVideo }
                isNarrowLayout = { this.props._isNarrowLayout }
                isVirtualScreenshareParticipant = { this.props._isVirtualScreenshareParticipant }
                maxEnabledResolution = { maxEnabledResolution }
                onOpenBandwidthDialog = { this.props._onOpenBandwidthDialog }
                onSaveLogs = { this.props._onSaveLogs }
                onShowMore = { this._onToggleShowMore }
                packetLoss = { packetLoss }
                participantId = { this.props.participantId }
                region = { this.props._region ?? '' }
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
    _getDisplayConfiguration(percent: number) {
        return QUALITY_TO_WIDTH.find(x => percent >= x.percent) || { tip: '' };
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
export function _mapDispatchToProps(dispatch: IStore['dispatch']) {
    return {
        /**
         * Saves the conference logs.
         *
         * @returns {Function}
         */
        _onSaveLogs() {
            dispatch(saveLogs());
        },

        /**
         * Opens the bandwidth settings dialog.
         *
         * @returns {void}
         */
        _onOpenBandwidthDialog() {
            dispatch(openDialog(BandwidthSettingsDialog));
        }
    };
}


/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantId } = ownProps;
    const conference = state['features/base/conference'].conference;
    const participant
        = participantId ? getParticipantById(state, participantId) : getLocalParticipant(state);
    const { isNarrowLayout } = state['features/base/responsive-ui'];
    const tracks = state['features/base/tracks'];
    const audioTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantId);
    let videoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantId);

    if (isScreenShareParticipant(participant)) {
        videoTrack = getVirtualScreenshareParticipantTrack(tracks, participant?.id ?? '');
    }

    const _isConnectionStatusInactive = isTrackStreamingStatusInactive(videoTrack);
    const _isConnectionStatusInterrupted = isTrackStreamingStatusInterrupted(videoTrack);

    return {
        _audioSsrc: audioTrack ? conference?.getSsrcByTrack(audioTrack.jitsiTrack) : undefined,
        _disableShowMoreStats: Boolean(state['features/base/config'].disableShowMoreStats),
        _enableAssumedBandwidth: state['features/base/config'].testing?.assumeBandwidth,
        _enableSaveLogs: Boolean(state['features/base/config'].enableSaveLogs),
        _isConnectionStatusInactive,
        _isConnectionStatusInterrupted,
        _isE2EEVerified: participant?.e2eeVerified,
        _isNarrowLayout: isNarrowLayout,
        _isVirtualScreenshareParticipant: isScreenShareParticipant(participant),
        _isLocalVideo: Boolean(participant?.local),
        _region: participant?.region,
        _videoSsrc: videoTrack ? conference?.getSsrcByTrack(videoTrack.jitsiTrack) : undefined
    };
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ConnectionIndicatorContent));

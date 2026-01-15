import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { withTheme } from 'react-native-paper';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { translate } from '../../../base/i18n/functions';
import { IconArrowDownLarge, IconArrowUpLarge } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getParticipantDisplayName } from '../../../base/participants/functions';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';
import {
    getTrackByMediaTypeAndParticipant
} from '../../../base/tracks/functions.native';
import {
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted
} from '../../../connection-indicator/functions';
import statsEmitter from '../../../connection-indicator/statsEmitter';

import styles from './styles';

/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 25;

const CONNECTION_QUALITY = [

    // Full (3 bars)
    {
        msg: 'connectionindicator.quality.good',
        percent: 30 // INDICATOR_DISPLAY_THRESHOLD
    },

    // 2 bars.
    {
        msg: 'connectionindicator.quality.nonoptimal',
        percent: 10
    },

    // 1 bar.
    {
        msg: 'connectionindicator.quality.poor',
        percent: 0
    }
];

interface IProps extends WithTranslation {

    /**
     * Whether this participant's connection is inactive.
     */
    _isConnectionStatusInactive: boolean;

    /**
     * Whether this participant's connection is interrupted.
     */
    _isConnectionStatusInterrupted: boolean;

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean;

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The ID of the participant that this button is supposed to pin.
     */
    participantID: string;

    /**
     * Theme used for styles.
     */
    theme: any;
}

/**
 * The type of the React {@code Component} state of {@link ConnectionStatusComponent}.
 */
type IState = {
    codecString: string;
    connectionString: string;
    downloadString: string;
    packetLostDownloadString: string;
    packetLostUploadString: string;
    resolutionString: string;
    serverRegionString: string;
    uploadString: string;
};

/**
 * Class to implement a popup menu that show the connection statistics.
 */
class ConnectionStatusComponent extends PureComponent<IProps, IState> {

    /**
     * Constructor of the component.
     *
     * @param {P} props - The read-only properties with which the new
     * instance is to be initialized.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onStatsUpdated = this._onStatsUpdated.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._renderMenuHeader = this._renderMenuHeader.bind(this);

        this.state = {
            resolutionString: 'N/A',
            downloadString: 'N/A',
            uploadString: 'N/A',
            packetLostDownloadString: 'N/A',
            packetLostUploadString: 'N/A',
            serverRegionString: 'N/A',
            codecString: 'N/A',
            connectionString: 'N/A'
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactNode}
     */
    override render() {
        const { t, theme } = this.props;
        const { palette } = theme;

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }>
                <View style = { styles.statsWrapper as ViewStyle }>
                    <View style = { styles.statsInfoCell as ViewStyle }>
                        <Text style = { styles.statsTitleText as TextStyle }>
                            { t('connectionindicator.status') }
                        </Text>
                        <Text style = { styles.statsInfoText as TextStyle }>
                            { t(this.state.connectionString) }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell as ViewStyle }>
                        <Text style = { styles.statsTitleText as TextStyle }>
                            { t('connectionindicator.bitrate') }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowDownLarge }
                            iconStyle = {{
                                color: palette.icon03
                            }} />
                        <Text style = { styles.statsInfoText as TextStyle }>
                            { this.state.downloadString }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowUpLarge }
                            iconStyle = {{
                                color: palette.icon03
                            }} />
                        <Text style = { styles.statsInfoText as TextStyle }>
                            { `${this.state.uploadString} Kbps` }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell as ViewStyle }>
                        <Text style = { styles.statsTitleText as TextStyle }>
                            { t('connectionindicator.packetloss') }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowDownLarge }
                            iconStyle = {{
                                color: palette.icon03
                            }} />
                        <Text style = { styles.statsInfoText as TextStyle }>
                            { this.state.packetLostDownloadString }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowUpLarge }
                            iconStyle = {{
                                color: palette.icon03
                            }} />
                        <Text style = { styles.statsInfoText as TextStyle }>
                            { this.state.packetLostUploadString }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell as ViewStyle }>
                        <Text style = { styles.statsTitleText as TextStyle }>
                            { t('connectionindicator.resolution') }
                        </Text>
                        <Text style = { styles.statsInfoText as TextStyle }>
                            { this.state.resolutionString }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell as ViewStyle }>
                        <Text style = { styles.statsTitleText as TextStyle }>
                            { t('connectionindicator.codecs') }
                        </Text>
                        <Text style = { styles.statsInfoText as TextStyle }>
                            { this.state.codecString }
                        </Text>
                    </View>
                </View>
            </BottomSheet>
        );
    }

    /**
     * Starts listening for stat updates.
     *
     * @inheritdoc
     * returns {void}
     */
    override componentDidMount() {
        statsEmitter.subscribeToClientStats(this.props.participantID, this._onStatsUpdated);
    }

    /**
     * Updates which user's stats are being listened to.
     *
     * @inheritdoc
     * returns {void}
     */
    override componentDidUpdate(prevProps: IProps) {
        if (prevProps.participantID !== this.props.participantID) {
            statsEmitter.unsubscribeToClientStats(
                prevProps.participantID, this._onStatsUpdated);
            statsEmitter.subscribeToClientStats(
                this.props.participantID, this._onStatsUpdated);
        }
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
        const newState = this._buildState(stats);

        this.setState(newState);
    }

    /**
     * Extracts statistics and builds the state object.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {State}
     */
    _buildState(stats: any) {
        const { download: downloadBitrate, upload: uploadBitrate } = this._extractBitrate(stats) ?? {};
        const { download: downloadPacketLost, upload: uploadPacketLost } = this._extractPacketLost(stats) ?? {};

        return {
            resolutionString: this._extractResolutionString(stats) ?? this.state.resolutionString,
            downloadString: downloadBitrate ?? this.state.downloadString,
            uploadString: uploadBitrate ?? this.state.uploadString,
            packetLostDownloadString: downloadPacketLost === undefined
                ? this.state.packetLostDownloadString : `${downloadPacketLost}%`,
            packetLostUploadString: uploadPacketLost === undefined
                ? this.state.packetLostUploadString : `${uploadPacketLost}%`,
            serverRegionString: this._extractServer(stats) ?? this.state.serverRegionString,
            codecString: this._extractCodecs(stats) ?? this.state.codecString,
            connectionString: this._extractConnection(stats)
        };
    }

    /**
     * Extracts the resolution and framerate.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractResolutionString(stats: any) {
        const { framerate, resolution } = stats;

        const resolutionString = Object.keys(resolution || {})
            .map(ssrc => {
                const { width, height } = resolution[ssrc];

                return `${width}x${height}`;
            })
            .join(', ') || null;

        const frameRateString = Object.keys(framerate || {})
            .map(ssrc => framerate[ssrc])
            .join(', ') || null;

        return resolutionString && frameRateString ? `${resolutionString}@${frameRateString}fps` : undefined;
    }

    /**
     * Extracts the download and upload bitrates.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {{ download, upload }}
     */
    _extractBitrate(stats: any) {
        return stats.bitrate;
    }

    /**
     * Extracts the download and upload packet lost.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {{ download, upload }}
     */
    _extractPacketLost(stats: any) {
        return stats.packetLoss;
    }

    /**
     * Extracts the server name.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractServer(stats: any) {
        return stats.serverRegion;
    }

    /**
     * Extracts the audio and video codecs names.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractCodecs(stats: any) {
        const { codec } = stats;

        let codecString;

        if (codec) {
            const audioCodecs = Object.values(codec)
                .map((c: any) => c.audio)
                .filter(Boolean);
            const videoCodecs = Object.values(codec)
                .map((c: any) => c.video)
                .filter(Boolean);

            if (audioCodecs.length || videoCodecs.length) {
                // Use a Set to eliminate duplicates.
                codecString = Array.from(new Set([ ...audioCodecs, ...videoCodecs ])).join(', ');
            }
        }

        return codecString;
    }

    /**
     * Extracts the connection percentage and sets connection quality.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractConnection(stats: any) {
        const { connectionQuality } = stats;
        const {
            _isConnectionStatusInactive,
            _isConnectionStatusInterrupted
        } = this.props;

        if (_isConnectionStatusInactive) {
            return 'connectionindicator.quality.inactive';
        } else if (_isConnectionStatusInterrupted) {
            return 'connectionindicator.quality.lost';
        } else if (typeof connectionQuality === 'undefined') {
            return 'connectionindicator.quality.good';
        }

        const qualityConfig = this._getQualityConfig(connectionQuality);

        return qualityConfig.msg;
    }

    /**
     * Get the quality configuration from CONNECTION_QUALITY which has a percentage
     * that matches or exceeds the passed in percentage. The implementation
     * assumes CONNECTION_QUALITY is already sorted by highest to lowest
     * percentage.
     *
     * @param {number} percent - The connection percentage, out of 100, to find
     * the closest matching configuration for.
     * @private
     * @returns {Object}
     */
    _getQualityConfig(percent: number): any {
        return CONNECTION_QUALITY.find(x => percent >= x.percent) || {};
    }

    /**
     * Callback to hide the {@code ConnectionStatusComponent}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        statsEmitter.unsubscribeToClientStats(this.props.participantID, this._onStatsUpdated);

        this.props.dispatch(hideSheet());
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { participantID } = this.props;

        return (
            <View
                style = { [
                    bottomSheetStyles.sheet,
                    styles.participantNameContainer ] as ViewStyle[] }>
                <Avatar
                    participantId = { participantID }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel as TextStyle }>
                    { this.props._participantDisplayName }
                </Text>
            </View>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState, ownProps: IProps) {
    const { participantID } = ownProps;
    const tracks = state['features/base/tracks'];
    const _videoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantID);
    const _isConnectionStatusInactive = isTrackStreamingStatusInactive(_videoTrack);
    const _isConnectionStatusInterrupted = isTrackStreamingStatusInterrupted(_videoTrack);

    return {
        _isConnectionStatusInactive,
        _isConnectionStatusInterrupted,
        _participantDisplayName: getParticipantDisplayName(state, participantID)
    };
}

export default translate(connect(_mapStateToProps)(withTheme(ConnectionStatusComponent)));

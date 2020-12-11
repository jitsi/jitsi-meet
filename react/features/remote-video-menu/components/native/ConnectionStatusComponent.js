// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, isDialogOpen, hideDialog } from '../../../base/dialog';
import { KICK_OUT_ENABLED, getFeatureFlag } from '../../../base/flags';
import { translate } from '../../../base/i18n';
import { IconArrowDownLarge, IconArrowUpLarge } from '../../../base/icons';
import { getParticipantDisplayName } from '../../../base/participants';
import { BaseIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType, ColorPalette } from '../../../base/styles';
import statsEmitter from '../../../connection-indicator/statsEmitter';

import styles from './styles';

/**
 * Size of the rendered avatar in the menu.
 */
const AVATAR_SIZE = 25;

const CONNECTION_QUALITY = [
    'Low',
    'Medium',
    'Good'
];

export type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the participant that this button is supposed to pin.
     */
    participantID: string,

    /**
     * The color-schemed stylesheet of the BottomSheet.
     */
    _bottomSheetStyles: StyleType,

    /**
     * True if the menu is currently open, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Display name of the participant retreived from Redux.
     */
    _participantDisplayName: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
}

// eslint-disable-next-line prefer-const
let ConnectionStatusComponent_;

/**
 * Class to implement a popup menu that show the connection statistics.
 */
class ConnectionStatusComponent extends Component<Props, *> {

    _resolutionString: string = 'N/A';
    _downloadString: string = 'N/A';
    _uploadString: string = 'N/A';
    _uploadString: string = 'N/A';
    _packetLostDownloadString: string = 'N/A';
    _packetLostUploadString: string = 'N/A';
    _serverRegionString: string = 'N/A';
    _codecString: string = 'N/A';
    _connectionString: string = 'N/A';

    /**
     * Constructor of the component.
     *
     * @param {P} props - The read-only properties with which the new
     * instance is to be initialized.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onStatsUpdated = this._onStatsUpdated.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._renderMenuHeader = this._renderMenuHeader.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render(): React$Node {
        const { t } = this.props;

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.resolution')} ` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { this._resolutionString }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.bitrate')}` }
                    </Text>
                    <BaseIndicator
                        icon = { IconArrowDownLarge }
                        iconStyle = {{
                            color: ColorPalette.darkGrey
                        }} />
                    <Text style = { styles.statsInfoText }>
                        { this._downloadString }
                    </Text>
                    <BaseIndicator
                        icon = { IconArrowUpLarge }
                        iconStyle = {{
                            color: ColorPalette.darkGrey
                        }} />
                    <Text style = { styles.statsInfoText }>
                        { `${this._uploadString} Kbps` }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.packetloss')}` }
                    </Text>
                    <BaseIndicator
                        icon = { IconArrowDownLarge }
                        iconStyle = {{
                            color: ColorPalette.darkGrey
                        }} />
                    <Text style = { styles.statsInfoText }>
                        { this._packetLostDownloadString }
                    </Text>
                    <BaseIndicator
                        icon = { IconArrowUpLarge }
                        iconStyle = {{
                            color: ColorPalette.darkGrey
                        }} />
                    <Text style = { styles.statsInfoText }>
                        { this._packetLostUploadString }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.connectedTo')}` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { this._serverRegionString }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.codecs')}` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { this._codecString }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.status')} ` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { this._connectionString }
                    </Text>
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
    componentDidMount() {
        statsEmitter.subscribeToClientStats(
            this.props.participantID, this._onStatsUpdated);
    }

    /**
     * Updates which user's stats are being listened to.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        if (prevProps.participantID !== this.props.participantID) {
            statsEmitter.unsubscribeToClientStats(
                prevProps.participantID, this._onStatsUpdated);
            statsEmitter.subscribeToClientStats(
                this.props.participantID, this._onStatsUpdated);
        }
    }

    _onStatsUpdated: Object => void;

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
        this._extractStats(stats);
        this.setState({ state: this.state });
    }

    /**
     * Extracts statistics.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _extractStats(stats) {
        this._extractResolutionString(stats);
        this._extractBitrate(stats);
        this._extractPacketLost(stats);
        this._extractServer(stats);
        this._extractCodecs(stats);
        this._extractConnection(stats);
    }

    /**
     * Extracts the resolution and framerate.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _extractResolutionString(stats) {
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

        if (resolutionString && frameRateString) {
            this._resolutionString = `${resolutionString}/${frameRateString}fps`;
        }
    }

    /**
     * Extracts the download and upload bitrates.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _extractBitrate(stats) {
        const { bitrate } = stats;
        const { download, upload } = bitrate || { };

        if (download) {
            this._downloadString = download;
        }

        if (upload) {
            this._uploadString = upload;
        }
    }

    /**
     * Extracts the download and upload packet lost.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _extractPacketLost(stats) {
        const { packetLoss } = stats;
        const { download, upload } = packetLoss || { };

        if (download !== undefined) {
            this._packetLostDownloadString = `${download}%`;
        }

        if (upload !== undefined) {
            this._packetLostUploadString = `${upload}%`;
        }
    }

    /**
     * Extracts the server name.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _extractServer(stats) {
        const { serverRegion } = stats;

        if (serverRegion) {
            this._serverRegionString = serverRegion;
        }
    }

    /**
     * Extracts the audio and video codecs names.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _extractCodecs(stats) {
        const { codec } = stats;

        // Only report one codec, in case there are multiple for a user.
        Object.keys(codec || {})
            .forEach(ssrc => {
                const { audio, video } = codec[ssrc];

                this._codecString = `${audio}, ${video}`;
            });
    }

    /**
     * Extracts the connection percentage and sets connection quality.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {void}
     */
    _extractConnection(stats) {
        const { connectionQuality } = stats;

        if (connectionQuality) {
            const signalLevel = Math.floor(connectionQuality / 33.4);

            this._connectionString = CONNECTION_QUALITY[signalLevel];
        }
    }

    _onCancel: () => boolean;

    /**
     * Callback to hide the {@code ConnectionStatusComponent}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        statsEmitter.unsubscribeToClientStats(
            this.props.participantID, this._onStatsUpdated);

        if (this.props._isOpen) {
            this.props.dispatch(hideDialog(ConnectionStatusComponent_));

            return true;
        }

        return false;
    }

    _renderMenuHeader: () => React$Element<any>;

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { _bottomSheetStyles, participantID } = this.props;

        return (
            <View
                style = { [
                    _bottomSheetStyles.sheet,
                    styles.participantNameContainer ] }>
                <Avatar
                    participantId = { participantID }
                    size = { AVATAR_SIZE } />
                <Text style = { styles.participantNameLabel }>
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
function _mapStateToProps(state, ownProps) {
    const kickOutEnabled = getFeatureFlag(state, KICK_OUT_ENABLED, true);
    const { participantID } = ownProps;
    const { remoteVideoMenu = {}, disableRemoteMute } = state['features/base/config'];
    let { disableKick } = remoteVideoMenu;

    disableKick = disableKick || !kickOutEnabled;

    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _disableKick: Boolean(disableKick),
        _disableRemoteMute: Boolean(disableRemoteMute),
        _isOpen: isDialogOpen(state, ConnectionStatusComponent_),
        _participantDisplayName: getParticipantDisplayName(state, participantID)
    };
}

ConnectionStatusComponent_ = translate(connect(_mapStateToProps)(ConnectionStatusComponent));

export default ConnectionStatusComponent_;

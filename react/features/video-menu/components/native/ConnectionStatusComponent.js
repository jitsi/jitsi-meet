// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { getLogger } from 'jitsi-meet-logger';
import { Avatar } from '../../../base/avatar';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, isDialogOpen, hideDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconArrowDownLarge, IconArrowUpLarge } from '../../../base/icons';
import { getParticipantDisplayName } from '../../../base/participants';
import { BaseIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType, ColorPalette } from '../../../base/styles';
import statsEmitter from '../../../connection-indicator/statsEmitter';
import styles from './styles';
import { getLocalParticipant, getParticipantById } from '../../../base/participants';

const logger = getLogger(__filename);

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
     * True if the menu is currently open, false otherwise.
     */
    _isLocal: boolean,

    /**
     * Display name of the participant retrieved from Redux.
     */
    _participantDisplayName: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function,
}

/**
 * The type of the React {@code Component} state of {@link ConnectionStatusComponent}.
 */
type State = {
    resolutionString: string,
    downloadString: string,
    uploadString: string,
    downloadBandwidthString: string,
    uploadBandWidthString: string,
    packetLostDownloadString: string,
    packetLostUploadString: string,
    serverRegionString: string,
    codecString: string,
    connectionString: string,
    transportData: {
      localIP: [],
      localPort: [],
      remoteIP: [],
      remotePort: [],
      transportType: [],
      additionalData: []
    }
};

// eslint-disable-next-line prefer-const
let ConnectionStatusComponent_;

/**
 * Class to implement a popup menu that show the connection statistics.
 */
class ConnectionStatusComponent extends Component<Props, State> {

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

        this.state = {
            resolutionString: 'N/A',
            downloadString: 'N/A',
            uploadString: 'N/A',
            downloadBandwidthString: 'N/A',
            uploadBandWidthString: 'N/A',
            packetLostDownloadString: 'N/A',
            packetLostUploadString: 'N/A',
            serverRegionString: 'N/A',
            codecString: 'N/A',
            connectionString: 'N/A',
            transportData: {
              localIP: [],
              localPort: [],
              remoteIP: [],
              remotePort: [],
              transportType: [],
              additionalData: []
            }
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render(): React$Node {
        const { t } = this.props;
        const isLocalVideo = this.props._isLocal;

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                renderHeader = { this._renderMenuHeader }>
                <View style = { styles.statsWrapper }>
                    <View style = { styles.statsInfoCell }>
                        <Text style = { styles.statsTitleText }>
                            { `${t('connectionindicator.status')} ` }
                        </Text>
                        <Text style = { styles.statsInfoText }>
                            { this.state.connectionString }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell }>
                        <Text style = { styles.statsTitleText }>
                            { `${t('connectionindicator.connectedTo')} ` }
                        </Text>
                        <Text style = { styles.statsInfoText }>
                            { this.state.serverRegionString }
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
                            { this.state.downloadString }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowUpLarge }
                            iconStyle = {{
                                color: ColorPalette.darkGrey
                            }} />
                        <Text style = { styles.statsInfoText }>
                            { `${this.state.uploadString} Kbps` }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell }>
                        <Text style = { styles.statsTitleText }>
                            { `${t('connectionindicator.bandwidth')}` }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowDownLarge }
                            iconStyle = {{
                                color: ColorPalette.darkGrey
                            }} />
                        <Text style = { styles.statsInfoText }>
                            { this.state.downloadBandwidthString }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowUpLarge }
                            iconStyle = {{
                                color: ColorPalette.darkGrey
                            }} />
                        <Text style = { styles.statsInfoText }>
                            { `${this.state.uploadBandWidthString} Kbps` }
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
                            { this.state.packetLostDownloadString }
                        </Text>
                        <BaseIndicator
                            icon = { IconArrowUpLarge }
                            iconStyle = {{
                                color: ColorPalette.darkGrey
                            }} />
                        <Text style = { styles.statsInfoText }>
                            { this.state.packetLostUploadString }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell }>
                        <Text style = { styles.statsTitleText }>
                            { `${t('connectionindicator.resolution')} ` }
                        </Text>
                        <Text style = { styles.statsInfoText }>
                            { this.state.resolutionString }
                        </Text>
                    </View>
                    <View style = { styles.statsInfoCell }>
                        <Text style = { styles.statsTitleText }>
                            { `${t('connectionindicator.codecs')}` }
                        </Text>
                        <Text style = { styles.statsInfoText }>
                            { this.state.codecString }
                        </Text>
                    </View>
                    { isLocalVideo ? this._renderTransport() : null }
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
    _buildState(stats) {
        const { download: downloadBitrate, upload: uploadBitrate } = this._extractBitrate(stats) ?? {};

        const { download: downloadPacketLost, upload: uploadPacketLost } = this._extractPacketLost(stats) ?? {};

        const { download: downloadBandwidth, upload: uploadBandWidth } = this._extractBandwidth(stats) ?? {};

        return {
            resolutionString: this._extractResolutionString(stats) ?? this.state.resolutionString,
            downloadString: downloadBitrate ?? this.state.downloadString,
            uploadString: uploadBitrate ?? this.state.uploadString,
            downloadBandwidthString: downloadBandwidth ?? this.state.downloadBandwidthString,
            uploadBandWidthString: uploadBandWidth ?? this.state.uploadBandWidthString,
            packetLostDownloadString: downloadPacketLost === undefined
                ? this.state.packetLostDownloadString : `${downloadPacketLost}%`,
            packetLostUploadString: uploadPacketLost === undefined
                ? this.state.packetLostUploadString : `${uploadPacketLost}%`,
            serverRegionString: this._extractServer(stats) ?? this.state.serverRegionString,
            codecString: this._extractCodecs(stats) ?? this.state.codecString,
            connectionString: this._extractConnection(stats) ?? this.state.connectionString,
            transportData: this._extractTransport(stats) ?? this.state.transportData
        };
    }

    /**
     * Extracts the resolution and framerate.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
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

        return resolutionString && frameRateString ? `${resolutionString}@${frameRateString}fps` : undefined;
    }

    /**
     * Extracts the download and upload bitrates.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {{ download, upload }}
     */
    _extractBitrate(stats) {
        return stats.bitrate;
    }

    /**
     * Extracts the download and upload bandwidth.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {{ download, upload }}
     */
    _extractBandwidth(stats) {
        return stats.bandwidth;
    }

    /**
     * Extracts the download and upload packet lost.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {{ download, upload }}
     */
    _extractPacketLost(stats) {
        return stats.packetLoss;
    }

    /**
     * Extracts the server name.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractServer(stats) {
        return stats.serverRegion;
    }

    /**
     * Extracts the audio and video codecs names.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractCodecs(stats) {
        const { codec } = stats;

        let codecString;

        // Only report one codec, in case there are multiple for a user.
        Object.keys(codec || {})
            .forEach(ssrc => {
                const { audio, video } = codec[ssrc];

                codecString = `${audio}, ${video}`;
            });

        return codecString;
    }

    /**
     * Extracts the connection percentage and sets connection quality.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractConnection(stats) {
        const { connectionQuality } = stats;

        if (connectionQuality) {
            const signalLevel = Math.floor(connectionQuality / 33.4);

            return CONNECTION_QUALITY[signalLevel];
        }
    }

    /**
     * Extracts transports.
     *
     * @param {Object} stats - Connection stats from the library.
     * @private
     * @returns {string}
     */
    _extractTransport(stats) {
        const { t, transport } = stats;
        const data = {
            localIP: [],
            localPort: [],
            remoteIP: [],
            remotePort: [],
            transportType: [],
            additionalData: []
        };

        if(!this.props._isLocal) {
            return data;
        }

        if (!transport || transport.length === 0) {
            return data;
        }

        for (let i = 0; i < transport.length; i++) {
            const ip = getIP(transport[i].ip);
            const localIP = getIP(transport[i].localip);
            const localPort = getPort(transport[i].localip);
            const port = getPort(transport[i].ip);

            if (!data.remoteIP.includes(ip)) {
                data.remoteIP.push(ip);
            }

            if (!data.localIP.includes(localIP)) {
                data.localIP.push(localIP);
            }

            if (!data.localPort.includes(localPort)) {
                data.localPort.push(localPort);
            }

            if (!data.remotePort.includes(port)) {
                data.remotePort.push(port);
            }

            if (!data.transportType.includes(transport[i].type)) {
                data.transportType.push(transport[i].type);
            }
        }

        // All of the transports should be either P2P or JVB
        let isP2P = false, isTURN = false;

        if (transport.length) {
            isP2P = transport[0].p2p;
            isTURN = transport[0].localCandidateType === 'relay'
                || transport[0].remoteCandidateType === 'relay';
        }

        if (isP2P) {
            data.additionalData.push(t('connectionindicator.peer_to_peer'));
        }
        if (isTURN) {
            data.additionalData.push(t('connectionindicator.turn'));
        }

        return data;
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

    /**
     * Creates table rows as ReactElements for displaying transport related
     * statistics.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderTransport() {
        const { t } = this.props;

        return (
            <View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.remoteaddress')}` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { getStringFromArray(this.state.transportData.remoteIP) }{ this.state.transportData.additionalData || null }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.remoteport')}` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { getStringFromArray(this.state.transportData.remotePort) }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.localaddress')}` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { getStringFromArray(this.state.transportData.localIP) }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.localport')}` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { getStringFromArray(this.state.transportData.localPort) }
                    </Text>
                </View>
                <View style = { styles.statsInfoCell }>
                    <Text style = { styles.statsTitleText }>
                        { `${t('connectionindicator.transport')}` }
                    </Text>
                    <Text style = { styles.statsInfoText }>
                        { getStringFromArray(this.state.transportData.transportType) }
                    </Text>
                </View>
            </View>
        );
    }
}

/**
 * Utility for getting the IP from a transport statistics object's
 * representation of an IP.
 *
 * @param {string} value - The transport's IP to parse.
 * @private
 * @returns {string}
 */
function getIP(value) {
    if (!value) {
        return '';
    }

    return value.substring(0, value.lastIndexOf(':'));
}

/**
 * Utility for getting the port from a transport statistics object's
 * representation of an IP.
 *
 * @param {string} value - The transport's IP to parse.
 * @private
 * @returns {string}
 */
function getPort(value) {
    if (!value) {
        return '';
    }

    return value.substring(value.lastIndexOf(':') + 1, value.length);
}

/**
 * Utility for concatenating values in an array into a comma separated string.
 *
 * @param {Array} array - Transport statistics to concatenate.
 * @private
 * @returns {string}
 */
function getStringFromArray(array) {
    let res = '';

    for (let i = 0; i < array.length; i++) {
        res += (i === 0 ? '' : ', ') + array[i];
    }

    return res;
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
    const { participantID } = ownProps;

    const participant = getParticipantById(state, participantID);
    const isLocal = participant?.local ?? true;

    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, ConnectionStatusComponent_),
        _isLocal: isLocal,
        _participantDisplayName: getParticipantDisplayName(state, participantID)
    };
}

ConnectionStatusComponent_ = translate(connect(_mapStateToProps)(ConnectionStatusComponent));

export default ConnectionStatusComponent_;

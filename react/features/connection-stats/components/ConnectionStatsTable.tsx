import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import ContextMenu from '../../base/components/context-menu/ContextMenu';
import { isMobileBrowser } from '../../base/environment/utils';
import { translate } from '../../base/i18n/functions';

type DownloadUpload = {
    download: number;
    upload: number;
};

/**
 * The type of the React {@code Component} props of
 * {@link ConnectionStatsTable}.
 */
interface Props extends WithTranslation {

    /**
     * The audio SSRC of this client.
     */
    audioSsrc: number;

    /**
     * Statistics related to bandwidth.
     * {{
     *     download: Number,
     *     upload: Number
     * }}.
     */
    bandwidth: DownloadUpload;

    /**
     * Statistics related to bitrate.
     * {{
     *     download: Number,
     *     upload: Number
     * }}.
     */
    bitrate: DownloadUpload;

    /**
     * The number of bridges (aka media servers) currently used in the
     * conference.
     */
    bridgeCount: number;

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * Audio/video codecs in use for the connection.
     */
    codec: {
        [key: string]: {
            audio: string;
            video: string;
        };
    };

    /**
     * A message describing the connection quality.
     */
    connectionSummary: string;

    /**
     * Whether or not should display the "Show More" link.
     */
    disableShowMoreStats: boolean;

    /**
     * Whether or not should display the "Save Logs" link.
     */
    enableSaveLogs: boolean;

    /**
     * Statistics related to frame rates for each ssrc.
     * {{
     *     [ ssrc ]: Number
     * }}.
     */
    framerate: Object;

    /**
     * Whether or not the statistics are for local video.
     */
    isLocalVideo: boolean;

    /**
     * Whether or not the statistics are for screen share.
     */
    isVirtualScreenshareParticipant: boolean;

    /**
     * The send-side max enabled resolution (aka the highest layer that is not
     * suspended on the send-side).
     */
    maxEnabledResolution: number;

    /**
     * Callback to invoke when the user clicks on the download logs link.
     */
    onSaveLogs: () => void;

    /**
     * Callback to invoke when the show additional stats link is clicked.
     */
    onShowMore: (e?: React.MouseEvent) => void;

    /**
     * Statistics related to packet loss.
     * {{
     *     download: Number,
     *     upload: Number
     * }}.
     */
    packetLoss: DownloadUpload;

    /**
     * The endpoint id of this client.
     */
    participantId: string;

    /**
     * The region that we think the client is in.
     */
    region: string;

    /**
     * Statistics related to display resolutions for each ssrc.
     * {{
     *     [ ssrc ]: {
     *         height: Number,
     *         width: Number
     *     }
     * }}.
     */
    resolution: {
        [ssrc: string]: {
            height: number;
            width: number;
        };
    };

    /**
     * The region of the media server that we are connected to.
     */
    serverRegion: string;

    /**
     * Whether or not additional stats about bandwidth and transport should be
     * displayed. Will not display even if true for remote participants.
     */
    shouldShowMore: boolean;

    /**
     * Whether source name signaling is enabled.
     */
    sourceNameSignalingEnabled: boolean;

    /**
     * Statistics related to transports.
     */
    transport: Array<{
        ip: string;
        localCandidateType: string;
        localip: string;
        p2p: boolean;
        remoteCandidateType: string;
        transportType: string;
        type: string;
    }>;

    /**
     * The video SSRC of this client.
     */
    videoSsrc: number;
}

/**
 * Click handler.
 *
 * @param {SyntheticEvent} event - The click event.
 * @returns {void}
 */
function onClick(event: React.MouseEvent) {
    // If the event is propagated to the thumbnail container the participant will be pinned. That's why the propagation
    // needs to be stopped.
    event.stopPropagation();
}

const styles = (theme: Theme) => {
    return {
        actions: {
            margin: '10px auto',
            textAlign: 'center' as const
        },
        connectionStatsTable: {
            '&, & > table': {
                fontSize: '12px',
                fontWeight: '400',

                '& td': {
                    padding: '2px 0'
                }
            },
            '& > table': {
                whiteSpace: 'nowrap'
            },

            '& td:nth-child(n-1)': {
                paddingLeft: '5px'
            },

            '& $upload, & $download': {
                marginRight: '2px'
            }
        },
        contextMenu: {
            position: 'relative' as const,
            marginTop: 0,
            right: 'auto',
            padding: `${theme.spacing(2)} ${theme.spacing(1)}`,
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
            marginBottom: theme.spacing(1)
        },
        download: {},
        mobile: {
            margin: theme.spacing(3)
        },
        status: {
            fontWeight: 'bold'
        },
        upload: {}
    };
};

/**
 * React {@code Component} for displaying connection statistics.
 *
 * @augments Component
 */
class ConnectionStatsTable extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            classes,
            disableShowMoreStats,
            enableSaveLogs,
            isVirtualScreenshareParticipant,
            isLocalVideo
        } = this.props;
        const className = clsx(classes.connectionStatsTable, { [classes.mobile]: isMobileBrowser() });

        if (isVirtualScreenshareParticipant) {
            return this._renderScreenShareStatus();
        }

        return (
            <ContextMenu
                className = { classes.contextMenu }
                hidden = { false }
                inDrawer = { true }>
                <div
                    className = { className }
                    onClick = { onClick }>
                    { this._renderStatistics() }
                    <div className = { classes.actions }>
                        { isLocalVideo && enableSaveLogs ? this._renderSaveLogs() : null}
                        { !disableShowMoreStats && this._renderShowMoreLink() }
                    </div>
                    { this.props.shouldShowMore ? this._renderAdditionalStats() : null }
                </div>
            </ContextMenu>
        );
    }

    /**
     * Creates a ReactElement that will display connection statistics for a screen share thumbnail.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderScreenShareStatus() {
        const { classes } = this.props;
        const className = clsx(classes.connectionStatsTable, { [classes.mobile]: isMobileBrowser() });

        return (<ContextMenu
            className = { classes.contextMenu }
            hidden = { false }
            inDrawer = { true }>
            <div
                className = { className }
                onClick = { onClick }>
                <tbody>
                    { this._renderResolution() }
                    { this._renderFrameRate() }
                </tbody>
            </div>
        </ContextMenu>);
    }

    /**
     * Creates a table as ReactElement that will display additional statistics
     * related to bandwidth and transport for the local user.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderAdditionalStats() {
        const { isLocalVideo } = this.props;

        return (
            <table>
                <tbody>
                    { isLocalVideo ? this._renderBandwidth() : null }
                    { isLocalVideo ? this._renderTransport() : null }
                    { isLocalVideo ? this._renderRegion() : null }
                    { this._renderAudioSsrc() }
                    { this._renderVideoSsrc() }
                    { this._renderParticipantId() }
                </tbody>
            </table>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying bandwidth related
     * statistics.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderBandwidth() {
        const { classes } = this.props;
        const { download, upload } = this.props.bandwidth || {};

        return (
            <tr>
                <td>
                    { this.props.t('connectionindicator.bandwidth') }
                </td>
                <td>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    { download ? `${download} Kbps` : 'N/A' }
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    { upload ? `${upload} Kbps` : 'N/A' }
                </td>
            </tr>
        );
    }

    /**
     * Creates a a table row as a ReactElement for displaying bitrate related
     * statistics.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderBitrate() {
        const { classes } = this.props;
        const { download, upload } = this.props.bitrate || {};

        return (
            <tr>
                <td>
                    <span>
                        { this.props.t('connectionindicator.bitrate') }
                    </span>
                </td>
                <td>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    { download ? `${download} Kbps` : 'N/A' }
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    { upload ? `${upload} Kbps` : 'N/A' }
                </td>
            </tr>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying the audio ssrc.
     * This will typically be something like "Audio SSRC: 12345".
     *
     * @returns {JSX.Element}
     * @private
     */
    _renderAudioSsrc() {
        const { audioSsrc, t } = this.props;

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.audio_ssrc') }</span>
                </td>
                <td>{ audioSsrc || 'N/A' }</td>
            </tr>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying the video ssrc.
     * This will typically be something like "Video SSRC: 12345".
     *
     * @returns {JSX.Element}
     * @private
     */
    _renderVideoSsrc() {
        const { videoSsrc, t } = this.props;

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.video_ssrc') }</span>
                </td>
                <td>{ videoSsrc || 'N/A' }</td>
            </tr>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying the endpoint id.
     * This will typically be something like "Endpoint id: 1e8fbg".
     *
     * @returns {JSX.Element}
     * @private
     */
    _renderParticipantId() {
        const { participantId, t } = this.props;

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.participant_id') }</span>
                </td>
                <td>{ participantId || 'N/A' }</td>
            </tr>
        );
    }

    /**
     * Creates a a table row as a ReactElement for displaying codec, if present.
     * This will typically be something like "Codecs (A/V): Opus, vp8".
     *
     * @private
     * @returns {ReactElement}
     */
    _renderCodecs() {
        const { codec, t, sourceNameSignalingEnabled } = this.props;

        if (!codec) {
            return;
        }

        let codecString;

        if (sourceNameSignalingEnabled) {
            codecString = `${codec.audio}, ${codec.video}`;
        } else {
            // Only report one codec, in case there are multiple for a user.
            Object.keys(codec || {})
                .forEach(ssrc => {
                    const { audio, video } = codec[ssrc];

                    codecString = `${audio}, ${video}`;
                });
        }

        if (!codecString) {
            codecString = 'N/A';
        }

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.codecs') }</span>
                </td>
                <td>{ codecString }</td>
            </tr>
        );
    }


    /**
     * Creates a table row as a ReactElement for displaying a summary message
     * about the current connection status.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderConnectionSummary() {
        const { classes } = this.props;

        return (
            <tr className = { classes.status }>
                <td>
                    <span>{ this.props.t('connectionindicator.status') }</span>
                </td>
                <td>{ this.props.connectionSummary }</td>
            </tr>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying the "connected to"
     * information.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderRegion() {
        const { region, serverRegion, t } = this.props;
        let str = serverRegion;

        if (!serverRegion) {
            return;
        }


        if (region && serverRegion && region !== serverRegion) {
            str += ` from ${region}`;
        }

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.connectedTo') }</span>
                </td>
                <td>{ str }</td>
            </tr>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying the "bridge count"
     * information.
     *
     * @returns {*}
     * @private
     */
    _renderBridgeCount() {
        const { bridgeCount, t } = this.props;

        // 0 is valid, but undefined/null/NaN aren't.
        if (!bridgeCount && bridgeCount !== 0) {
            return;
        }

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.bridgeCount') }</span>
                </td>
                <td>{ bridgeCount }</td>
            </tr>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying frame rate related
     * statistics.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderFrameRate() {
        const { framerate, t, sourceNameSignalingEnabled } = this.props;

        let frameRateString;

        if (sourceNameSignalingEnabled) {
            frameRateString = framerate || 'N/A';
        } else {
            frameRateString = Object.keys(framerate || {})
                .map(ssrc => framerate[ssrc as keyof typeof framerate])
                .join(', ') || 'N/A';
        }

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.framerate') }</span>
                </td>
                <td>{ frameRateString }</td>
            </tr>
        );
    }

    /**
     * Creates a tables row as a ReactElement for displaying packet loss related
     * statistics.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPacketLoss() {
        const { classes, packetLoss, t } = this.props;
        let packetLossTableData;

        if (packetLoss) {
            const { download, upload } = packetLoss;

            packetLossTableData = (
                <td>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    { download === null ? 'N/A' : `${download}%` }
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    { upload === null ? 'N/A' : `${upload}%` }
                </td>
            );
        } else {
            packetLossTableData = <td>N/A</td>;
        }

        return (
            <tr>
                <td>
                    <span>
                        { t('connectionindicator.packetloss') }
                    </span>
                </td>
                { packetLossTableData }
            </tr>
        );
    }

    /**
     * Creates a table row as a ReactElement for displaying resolution related
     * statistics.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderResolution() {
        const { resolution, maxEnabledResolution, t, sourceNameSignalingEnabled } = this.props;
        let resolutionString;

        if (sourceNameSignalingEnabled) {
            resolutionString = resolution ? `${resolution.width}x${resolution.height}` : 'N/A';
        } else {
            resolutionString = Object.keys(resolution || {})
                .map(ssrc => {
                    const { width, height } = resolution[ssrc];

                    return `${width}x${height}`;
                })
                .join(', ') || 'N/A';
        }

        if (maxEnabledResolution && maxEnabledResolution < 720) {
            const maxEnabledResolutionTitle = t('connectionindicator.maxEnabledResolution');

            resolutionString += ` (${maxEnabledResolutionTitle} ${maxEnabledResolution}p)`;
        }

        return (
            <tr>
                <td>
                    <span>{ t('connectionindicator.resolution') }</span>
                </td>
                <td>{ resolutionString }</td>
            </tr>
        );
    }

    /**
     * Creates a ReactElement for display a link to save the logs.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSaveLogs() {
        return (
            <span>
                <a
                    className = 'savelogs link'
                    onClick = { this.props.onSaveLogs }
                    role = 'button'
                    tabIndex = { 0 }>
                    { this.props.t('connectionindicator.savelogs') }
                </a>
                <span> | </span>
            </span>
        );
    }


    /**
     * Creates a ReactElement for display a link to toggle showing additional
     * statistics.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderShowMoreLink() {
        const translationKey
            = this.props.shouldShowMore
                ? 'connectionindicator.less'
                : 'connectionindicator.more';

        return (
            <a
                className = 'showmore link'
                onClick = { this.props.onShowMore }
                role = 'button'
                tabIndex = { 0 }>
                { this.props.t(translationKey) }
            </a>
        );
    }

    /**
     * Creates a table as a ReactElement for displaying connection statistics.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderStatistics() {
        const isRemoteVideo = !this.props.isLocalVideo;

        return (
            <table>
                <tbody>
                    { this._renderConnectionSummary() }
                    { this._renderBitrate() }
                    { this._renderPacketLoss() }
                    { isRemoteVideo ? this._renderRegion() : null }
                    { this._renderResolution() }
                    { this._renderFrameRate() }
                    { this._renderCodecs() }
                    { isRemoteVideo ? null : this._renderBridgeCount() }
                </tbody>
            </table>
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
        const { t, transport } = this.props;

        if (!transport || transport.length === 0) {
            const NA = (
                <tr key = 'address'>
                    <td>
                        <span>{ t('connectionindicator.address') }</span>
                    </td>
                    <td>
                        N/A
                    </td>
                </tr>
            );

            return [ NA ];
        }

        const data: {
            localIP: string[];
            localPort: string[];
            remoteIP: string[];
            remotePort: string[];
            transportType: string[];
        } = {
            localIP: [],
            localPort: [],
            remoteIP: [],
            remotePort: [],
            transportType: []
        };

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

        const additionalData = [];

        if (isP2P) {
            additionalData.push(
                <span> (p2p)</span>);
        }
        if (isTURN) {
            additionalData.push(<span> (turn)</span>);
        }

        // First show remote statistics, then local, and then transport type.
        const tableRowConfigurations = [
            {
                additionalData,
                data: data.remoteIP,
                key: 'remoteaddress',
                label: t('connectionindicator.remoteaddress',
                    { count: data.remoteIP.length })
            },
            {
                data: data.remotePort,
                key: 'remoteport',
                label: t('connectionindicator.remoteport',
                        { count: transport.length })
            },
            {
                data: data.localIP,
                key: 'localaddress',
                label: t('connectionindicator.localaddress',
                    { count: data.localIP.length })
            },
            {
                data: data.localPort,
                key: 'localport',
                label: t('connectionindicator.localport',
                    { count: transport.length })
            },
            {
                data: data.transportType,
                key: 'transport',
                label: t('connectionindicator.transport',
                    { count: data.transportType.length })
            }
        ];

        return tableRowConfigurations.map(this._renderTransportTableRow);
    }

    /**
     * Creates a table row as a ReactElement for displaying a transport related
     * statistic.
     *
     * @param {Object} config - Describes the contents of the row.
     * @param {ReactElement} config.additionalData - Extra data to display next
     * to the passed in config.data.
     * @param {Array} config.data - The transport statistics to display.
     * @param {string} config.key - The ReactElement's key. Must be unique for
     * iterating over multiple child rows.
     * @param {string} config.label - The text to display describing the data.
     * @private
     * @returns {ReactElement}
     */
    _renderTransportTableRow(config: any) {
        const { additionalData, data, key, label } = config;

        return (
            <tr key = { key }>
                <td>
                    <span>
                        { label }
                    </span>
                </td>
                <td>
                    { getStringFromArray(data) }
                    { additionalData || null }
                </td>
            </tr>
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
function getIP(value: string) {
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
function getPort(value: string) {
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
function getStringFromArray(array: string[]) {
    let res = '';

    for (let i = 0; i < array.length; i++) {
        res += (i === 0 ? '' : ', ') + array[i];
    }

    return res;
}

export default translate(withStyles(styles)(ConnectionStatsTable));

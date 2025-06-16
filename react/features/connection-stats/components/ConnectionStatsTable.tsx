/* eslint-disable react/no-multi-comp */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../base/environment/utils';
import Icon from '../../base/icons/components/Icon';
import { IconGear } from '../../base/icons/svg';
import ContextMenu from '../../base/ui/components/web/ContextMenu';

type DownloadUpload = {
    download: number;
    upload: number;
};

/**
 * The type of the React {@code Component} props of
 * {@link ConnectionStatsTable}.
 */
interface IProps {

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
     * Audio/video codecs in use for the connection.
     */
    codec: {
        [key: string]: {
            audio: string | undefined;
            video: string | undefined;
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
     * Whether or not the participant was verified.
     */
    e2eeVerified?: boolean;

    /**
     * Whether to enable assumed bandwidth.
     */
    enableAssumedBandwidth?: boolean;

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
    framerate: {
        [ssrc: string]: number;
    };

    /**
     * Whether or not the statistics are for local video.
     */
    isLocalVideo: boolean;

    /**
     * Whether we are in narrow layout mode or not.
     */
    isNarrowLayout: boolean;

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
     * Callback to invoke when the user clicks on the open bandwidth settings dialog icon.
     */
    onOpenBandwidthDialog: () => void;

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

const useStyles = makeStyles()(theme => {
    return {
        actions: {
            margin: '10px auto',
            textAlign: 'center'
        },
        assumedBandwidth: {
            cursor: 'pointer',
            margin: '0 5px'
        },
        bandwidth: {
            alignItems: 'center',
            display: 'flex'
        },
        connectionStatsTable: {
            '&, & > table': {
                fontSize: '12px',
                fontWeight: 400,

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
            position: 'relative',
            margin: 0,
            right: 'auto',
            padding: `${theme.spacing(2)} ${theme.spacing(1)}`
        },
        download: {},
        mobile: {
            margin: theme.spacing(3)
        },
        status: {
            fontWeight: 'bold'
        },
        upload: {},
        link: {
            cursor: 'pointer',
            color: theme.palette.link01,
            transition: 'color .2s ease',
            border: 0,
            background: 0,
            padding: 0,
            display: 'inline',
            fontWeight: 'bold',

            '&:hover': {
                color: theme.palette.link01Hover,
                textDecoration: 'underline'
            },

            '&:active': {
                color: theme.palette.link01Active
            }
        }
    };
});

const ConnectionStatsTable = ({
    audioSsrc,
    bandwidth,
    bitrate,
    bridgeCount,
    codec,
    connectionSummary,
    disableShowMoreStats,
    e2eeVerified,
    enableAssumedBandwidth,
    enableSaveLogs,
    framerate,
    isVirtualScreenshareParticipant,
    isLocalVideo,
    isNarrowLayout,
    maxEnabledResolution,
    onOpenBandwidthDialog,
    onSaveLogs,
    onShowMore,
    packetLoss,
    participantId,
    region,
    resolution,
    serverRegion,
    shouldShowMore,
    transport,
    videoSsrc
}: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();

    const _renderResolution = () => {
        let resolutionString = 'N/A';

        if (resolution && videoSsrc) {
            const { width, height } = resolution[videoSsrc] ?? {};

            if (width && height) {
                resolutionString = `${width}x${height}`;

                if (maxEnabledResolution && maxEnabledResolution < 720 && !isVirtualScreenshareParticipant) {
                    const maxEnabledResolutionTitle = t('connectionindicator.maxEnabledResolution');

                    resolutionString += ` (${maxEnabledResolutionTitle} ${maxEnabledResolution}p)`;
                }
            }
        }

        return (
            <tr>
                <td>
                    <span>{t('connectionindicator.resolution')}</span>
                </td>
                <td>{resolutionString}</td>
            </tr>
        );
    };

    const _renderFrameRate = () => {
        let frameRateString = 'N/A';

        if (framerate) {
            frameRateString = String(framerate[videoSsrc] ?? 'N/A');
        }

        return (
            <tr>
                <td>
                    <span>{t('connectionindicator.framerate')}</span>
                </td>
                <td>{frameRateString}</td>
            </tr>
        );
    };

    const _renderScreenShareStatus = () => {
        const className = cx(classes.connectionStatsTable, { [classes.mobile]: isMobileBrowser() });

        return (<ContextMenu
            className = { classes.contextMenu }
            hidden = { false }
            inDrawer = { true }>
            <div
                className = { className }
                onClick = { onClick }>
                <tbody>
                    {_renderResolution()}
                    {_renderFrameRate()}
                </tbody>
            </div>
        </ContextMenu>);
    };

    const _renderBandwidth = () => {
        const { download, upload } = bandwidth || {};

        return (
            <tr>
                <td>
                    {t('connectionindicator.bandwidth')}
                </td>
                <td className = { classes.bandwidth }>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    {download ? `${download} Kbps` : 'N/A'}
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    {upload ? `${upload} Kbps` : 'N/A'}
                    {enableAssumedBandwidth && (
                        <div
                            className = { classes.assumedBandwidth }
                            onClick = { onOpenBandwidthDialog }>
                            <Icon
                                size = { 10 }
                                src = { IconGear } />
                        </div>
                    )}
                </td>
            </tr>
        );
    };

    const _renderTransportTableRow = (config: any) => {
        const { additionalData, data, key, label } = config;

        return (
            <tr key = { key }>
                <td>
                    <span>
                        {label}
                    </span>
                </td>
                <td>
                    {getStringFromArray(data)}
                    {additionalData || null}
                </td>
            </tr>
        );
    };

    const _renderTransport = () => {
        if (!transport || transport.length === 0) {
            const NA = (
                <tr key = 'address'>
                    <td>
                        <span>{t('connectionindicator.address')}</span>
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

        return tableRowConfigurations.map(_renderTransportTableRow);
    };

    const _renderRegion = () => {
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
                    <span>{t('connectionindicator.connectedTo')}</span>
                </td>
                <td>{str}</td>
            </tr>
        );
    };

    const _renderBridgeCount = () => {
        // 0 is valid, but undefined/null/NaN aren't.
        if (!bridgeCount && bridgeCount !== 0) {
            return;
        }

        return (
            <tr>
                <td>
                    <span>{t('connectionindicator.bridgeCount')}</span>
                </td>
                <td>{bridgeCount}</td>
            </tr>
        );
    };

    const _renderAudioSsrc = () => (
        <tr>
            <td>
                <span>{t('connectionindicator.audio_ssrc')}</span>
            </td>
            <td>{audioSsrc || 'N/A'}</td>
        </tr>
    );

    const _renderVideoSsrc = () => (
        <tr>
            <td>
                <span>{t('connectionindicator.video_ssrc')}</span>
            </td>
            <td>{videoSsrc || 'N/A'}</td>
        </tr>
    );

    const _renderParticipantId = () => (
        <tr>
            <td>
                <span>{t('connectionindicator.participant_id')}</span>
            </td>
            <td>{participantId || 'N/A'}</td>
        </tr>
    );

    const _renderE2EEVerified = () => {
        if (e2eeVerified === undefined) {
            return;
        }

        return (
            <tr>
                <td>
                    <span>{t('connectionindicator.e2eeVerified')}</span>
                </td>
                <td>{t(`connectionindicator.${e2eeVerified ? 'yes' : 'no'}`)}</td>
            </tr>
        );
    };

    const _renderAdditionalStats = () => (
        <table>
            <tbody>
                {isLocalVideo ? _renderBandwidth() : null}
                {isLocalVideo ? _renderTransport() : null}
                {_renderRegion()}
                {isLocalVideo ? _renderBridgeCount() : null}
                {_renderAudioSsrc()}
                {_renderVideoSsrc()}
                {_renderParticipantId()}
                {_renderE2EEVerified()}
            </tbody>
        </table>
    );

    const _renderBitrate = () => {
        const { download, upload } = bitrate || {};

        return (
            <tr>
                <td>
                    <span>
                        {t('connectionindicator.bitrate')}
                    </span>
                </td>
                <td>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    {download ? `${download} Kbps` : 'N/A'}
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    {upload ? `${upload} Kbps` : 'N/A'}
                </td>
            </tr>
        );
    };

    const _renderCodecs = () => {
        let codecString = 'N/A';

        if (codec) {
            const audioCodec = codec[audioSsrc]?.audio;
            const videoCodec = codec[videoSsrc]?.video;

            if (audioCodec || videoCodec) {
                codecString = [ audioCodec, videoCodec ].filter(Boolean).join(', ');
            }
        }

        return (
            <tr>
                <td>
                    <span>{t('connectionindicator.codecs')}</span>
                </td>
                <td>{codecString}</td>
            </tr>
        );
    };

    const _renderConnectionSummary = () => (
        <tr className = { classes.status }>
            <td>
                <span>{t('connectionindicator.status')}</span>
            </td>
            <td>{connectionSummary}</td>
        </tr>
    );

    const _renderPacketLoss = () => {
        let packetLossTableData;

        if (packetLoss) {
            const { download, upload } = packetLoss;

            packetLossTableData = (
                <td>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    {download === null ? 'N/A' : `${download}%`}
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    {upload === null ? 'N/A' : `${upload}%`}
                </td>
            );
        } else {
            packetLossTableData = <td>N/A</td>;
        }

        return (
            <tr>
                <td>
                    <span>
                        {t('connectionindicator.packetloss')}
                    </span>
                </td>
                {packetLossTableData}
            </tr>
        );
    };

    const _renderSaveLogs = () => (
        <span>
            <button
                className = { cx(classes.link, 'savelogs') }
                onClick = { onSaveLogs }
                type = 'button'>
                {t('connectionindicator.savelogs')}
            </button>
            <span> | </span>
        </span>
    );

    const _renderShowMoreLink = () => {
        const translationKey
            = shouldShowMore
                ? 'connectionindicator.less'
                : 'connectionindicator.more';

        return (
            <button
                className = { cx(classes.link, 'showmore') }
                onClick = { onShowMore }
                type = 'button'>
                {t(translationKey)}
            </button>
        );
    };

    const _renderStatistics = () => (
        <table>
            <tbody>
                {_renderConnectionSummary()}
                {_renderBitrate()}
                {_renderPacketLoss()}
                {_renderResolution()}
                {_renderFrameRate()}
                {_renderCodecs()}
            </tbody>
        </table>
    );

    if (isVirtualScreenshareParticipant) {
        return _renderScreenShareStatus();
    }

    return (
        <ContextMenu
            className = { classes.contextMenu }
            hidden = { false }
            inDrawer = { true }>
            <div
                className = { cx(classes.connectionStatsTable, {
                    [classes.mobile]: isMobileBrowser() || isNarrowLayout }) }
                onClick = { onClick }>
                {_renderStatistics()}
                <div className = { classes.actions }>
                    {isLocalVideo && enableSaveLogs ? _renderSaveLogs() : null}
                    {!disableShowMoreStats && _renderShowMoreLink()}
                </div>
                {shouldShowMore ? _renderAdditionalStats() : null}
            </div>
        </ContextMenu>
    );
};

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

export default ConnectionStatsTable;

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
 * {@link ConnectionStatsList}.
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
        connectionStats: {
            fontSize: '12px',
            fontWeight: 400,
            width: '250px',

            '& > ul': {
                listStyleType: 'none',
                margin: '8px',
                padding: 0,

                '& > li': {
                    display: 'flex',

                    '& > label': {
                        paddingRight: '4px',
                        width: '50%'
                    }
                }
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

const ConnectionStatsList = ({
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

    const NA = 'N/A';

    const _renderListItem = (
            label: string,
            value: string | number | JSX.Element,
            id: string,
            classNames?: string
    ): JSX.Element => (
        <li
            className = { classNames }
            key = { id } >
            <label
                htmlFor = { id } >
                { label }
            </label>
            <output
                id = { id } >
                { value }
            </output>
        </li>
    );

    const _renderResolution = (): JSX.Element => {
        let resolutionString = NA;

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

        return _renderListItem(
            t('connectionindicator.resolution'),
            resolutionString,
            'connection-stat-resolution'
        );
    };

    const _renderFrameRate = (): JSX.Element => {
        let frameRateString = NA;

        if (framerate) {
            frameRateString = String(framerate[videoSsrc] ?? NA);
        }

        return _renderListItem(
            t('connectionindicator.framerate'),
            frameRateString,
            'connection-stat-frame-rate'
        );
    };

    const _renderScreenShareStatus = (): JSX.Element => (<ContextMenu
        className = { classes.contextMenu }
        hidden = { false }
        inDrawer = { true }>
        <div
            className = { cx(classes.connectionStats, { [classes.mobile]: isMobileBrowser() }) }
            onClick = { onClick }>
            <ul>
                {_renderResolution()}
                {_renderFrameRate()}
            </ul>
        </div>
    </ContextMenu>);

    const _renderBandwidth = (): JSX.Element => {
        const { download, upload } = bandwidth || {};

        return _renderListItem(
            t('connectionindicator.bandwidth'),
            (
                <>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    {download ? `${download} Kbps` : NA}
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    {upload ? `${upload} Kbps` : NA}
                    {enableAssumedBandwidth && (
                        <div
                            className = { classes.assumedBandwidth }
                            onClick = { onOpenBandwidthDialog }>
                            <Icon
                                size = { 10 }
                                src = { IconGear } />
                        </div>
                    )}
                </>
            ),
            'connection-stat-bandwidth'
        );
    };

    interface ITransportData {
        additionalData?: Array<JSX.Element>;
        data: Array<string>;
        key: string;
        label: string;
    }

    const _renderTransportList = (config: ITransportData): JSX.Element => {
        const { additionalData, data, key, label } = config;

        return _renderListItem(
            label,
            (
                <>
                    {getStringFromArray(data)}
                    {additionalData}
                </>
            ),
            key
        );
    };

    const _renderTransport = (): JSX.Element[] => {
        if (!transport || transport.length === 0) {
            return [ _renderListItem(
                t('connectionindicator.address'),
                NA,
                'connection-stat-address'
            ) ];
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

        const additionalData: Array<JSX.Element> = [];

        if (isP2P) {
            additionalData.push(
                <span>(p2p)</span>);
        }
        if (isTURN) {
            additionalData.push(<span>(turn)</span>);
        }

        // First show remote statistics, then local, and then transport type.
        const listConfigurations: ITransportData[] = [
            {
                additionalData,
                data: data.remoteIP,
                key: 'connection-stat-remoteaddress',
                label: t('connectionindicator.remoteaddress',
                    { count: data.remoteIP.length })
            },
            {
                data: data.remotePort,
                key: 'connection-stat-remoteport',
                label: t('connectionindicator.remoteport',
                    { count: transport.length })
            },
            {
                data: data.localIP,
                key: 'connection-stat-localaddress',
                label: t('connectionindicator.localaddress',
                    { count: data.localIP.length })
            },
            {
                data: data.localPort,
                key: 'connection-stat-localport',
                label: t('connectionindicator.localport',
                    { count: transport.length })
            },
            {
                data: data.transportType,
                key: 'connection-stat-transport',
                label: t('connectionindicator.transport',
                    { count: data.transportType.length })
            }
        ];

        return listConfigurations.map(_renderTransportList);
    };

    const _renderRegion = (): JSX.Element => {
        let str = serverRegion;

        if (!serverRegion) {
            return <></>;
        }


        if (region && serverRegion && region !== serverRegion) {
            str += ` from ${region}`;
        }

        return _renderListItem(
            t('connectionindicator.connectedTo'),
            str,
            'connection-stat-region'
        );
    };

    const _renderBridgeCount = (): JSX.Element => {
        // 0 is valid, but undefined/null/NaN aren't.
        if (!bridgeCount && bridgeCount !== 0) {
            return <></>;
        }

        return _renderListItem(
            t('connectionindicator.bridgeCount'),
            bridgeCount,
            'connection-stat-bridge-count'
        );
    };

    const _renderAudioSsrc = (): JSX.Element => _renderListItem(
        t('connectionindicator.audio_ssrc'),
        audioSsrc || NA,
        'connection-stat-audio-ssrc'
    );

    const _renderVideoSsrc = (): JSX.Element => _renderListItem(
        t('connectionindicator.video_ssrc'),
        videoSsrc || NA,
        'connection-stat-video-ssrc'
    );

    const _renderParticipantId = (): JSX.Element => _renderListItem(
        t('connectionindicator.participant_id'),
        participantId || NA,
        'connection-stat-participant-id'
    );

    const _renderE2EEVerified = (): JSX.Element => {
        if (e2eeVerified === undefined) {
            return <></>;
        }

        return _renderListItem(
            t('connectionindicator.e2eeVerified'),
            t<string>(`connectionindicator.${e2eeVerified ? 'yes' : 'no'}`),
            'connection-stat-e2ee-verified'
        );
    };

    const _renderAdditionalStats = (): JSX.Element => (
        <ul>
            {isLocalVideo ? _renderBandwidth() : null}
            {isLocalVideo ? _renderTransport() : null}
            {_renderRegion()}
            {isLocalVideo ? _renderBridgeCount() : null}
            {_renderAudioSsrc()}
            {_renderVideoSsrc()}
            {_renderParticipantId()}
            {_renderE2EEVerified()}
        </ul>
    );

    const _renderBitrate = (): JSX.Element => {
        const { download, upload } = bitrate || {};

        return _renderListItem(
            t('connectionindicator.bitrate'),
            (
                <>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    { download ? `${download} Kbps` : NA}
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    {upload ? `${upload} Kbps` : NA}
                </>
            ),
            'connection-stat-bitrate'
        );
    };

    const _renderCodecs = (): JSX.Element => {
        let codecString = NA;

        if (codec) {
            const audioCodec = codec[audioSsrc]?.audio;
            const videoCodec = codec[videoSsrc]?.video;

            if (audioCodec || videoCodec) {
                codecString = [ audioCodec, videoCodec ].filter(Boolean).join(', ');
            }
        }

        return _renderListItem(
            t('connectionindicator.codecs'),
            codecString,
            'connection-stat-codecs'
        );
    };

    const _renderConnectionSummary = (): JSX.Element => _renderListItem(
        t('connectionindicator.status'),
        connectionSummary,
        'connection-stat-connection-summary',
        classes.status
    );

    const _renderPacketLoss = (): JSX.Element => {
        let packetLossData: string | JSX.Element;

        if (packetLoss) {
            const { download, upload } = packetLoss;

            packetLossData = (
                <>
                    <span className = { classes.download }>
                        &darr;
                    </span>
                    {download === null ? NA : `${download}%`}
                    <span className = { classes.upload }>
                        &uarr;
                    </span>
                    {upload === null ? NA : `${upload}%`}
                </>
            );
        } else {
            packetLossData = NA;
        }

        return _renderListItem(
            t('connectionindicator.packetloss'),
            packetLossData,
            'connection-stat-package-loss'
        );
    };

    const _renderSaveLogs = (): JSX.Element => (
        <span>
            <button
                className = { cx(classes.link, 'savelogs') }
                onClick = { onSaveLogs }
                type = 'button'>
                { t<string>('connectionindicator.savelogs') }
            </button>
            <span> | </span>
        </span>
    );

    const _renderShowMoreLink = (): JSX.Element => {
        const translationKey
            = shouldShowMore
                ? 'connectionindicator.less'
                : 'connectionindicator.more';

        return (
            <button
                className = { cx(classes.link, 'showmore') }
                onClick = { onShowMore }
                type = 'button'>
                { t<string>(translationKey) }
            </button>
        );
    };

    const _renderStatistics = (): JSX.Element => (
        <ul>
            {_renderConnectionSummary()}
            {_renderBitrate()}
            {_renderPacketLoss()}
            {_renderResolution()}
            {_renderFrameRate()}
            {_renderCodecs()}
        </ul>
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
                className = { cx(classes.connectionStats, {
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

export default ConnectionStatsList;

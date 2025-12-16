import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';

// @ts-expect-error
import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { IReduxState } from '../../../app/types';
import { FakeParticipant } from '../../../base/participants/types';
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { getToolboxHeight } from '../../../toolbox/functions.web';
import { isSharedVideoEnabled, isVideoPlaying } from '../../functions';

import VideoManager from './VideoManager';
import YoutubeVideoManager from './YoutubeVideoManager';

interface IProps {

    /**
     * The available client width.
     */
    clientHeight: number;

    /**
     * The available client width.
     */
    clientWidth: number;

    /**
     * Whether the (vertical) filmstrip is visible or not.
     */
    filmstripVisible: boolean;

    /**
     * The width of the vertical filmstrip.
     */
    filmstripWidth: number;

    /**
     * Whether the shared video is enabled or not.
     */
    isEnabled: boolean;

    /**
     * Whether the user is actively resizing the filmstrip.
     */
    isResizing: boolean;

    /**
     * Whether the shared video is currently playing.
     */
    isVideoShared: boolean;

    /**
     * Whether the shared video should be shown on stage.
     */
    onStage: boolean;

    /**
     * The shared video url.
     */
    videoUrl?: string;
}

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class SharedVideo extends Component<IProps> {
    videoRef = createRef<HTMLVideoElement>();

    override componentDidMount() {
        this.maybeInitWHEP();
    }

    override componentDidUpdate(prevProps: IProps) {
        if (this.props.onStage && this.props.isEnabled && (!prevProps.onStage || !prevProps.isEnabled)) {
            this.maybeInitWHEP();
        }
    }

    maybeInitWHEP() {
        if (this.props.onStage && this.props.isEnabled && this.videoRef.current) {
            // Inject reader.js only once
            if (!document.getElementById('reader-js')) {
                const script = document.createElement('script');

                script.src = 'https://mobifone-solution.xbstation.com/css/player/reader.js';
                script.defer = true;
                script.id = 'reader-js';
                script.onload = () => this.initWHEP();
                document.body.appendChild(script);
            } else {
                this.initWHEP();
            }
        }
    }

    initWHEP() {
        const video = this.videoRef.current;

        if (!video) return;
        // Helper
        const parseBoolString = (str: string | null, defaultVal: boolean): boolean => {
            str = (str || '');
            if ([ '1', 'yes', 'true' ].includes(str.toLowerCase())) return true;
            if ([ '0', 'no', 'false' ].includes(str.toLowerCase())) return false;

            return defaultVal;
        };
        const loadAttributesFromQuery = () => {
            const params = new URLSearchParams(window.location.search);

            video.controls = parseBoolString(params.get('controls'), true);
            video.muted = parseBoolString(params.get('muted'), true);
            video.autoplay = parseBoolString(params.get('autoplay'), true);
            video.playsInline = parseBoolString(params.get('playsinline'), true);
            video.disablePictureInPicture = parseBoolString(params.get('disablepictureinpicture'), false);
        };

        loadAttributesFromQuery();
        // @ts-ignore
        window.reader = new window.MediaMTXWebRTCReader({
            url: 'https://media.platform.xbstation.com/stream/whep',
            user: 'xb',
            pass: 'xbpassforisrtesting',
            onError: (err: any) => {
                console.error('WHEP Error:', err);
            },
            onTrack: (evt: any) => {
                if (video.srcObject === null) {
                    video.srcObject = evt.streams[0];
                    video.onloadedmetadata = () => {
                        video.play().catch(() => {});
                    };
                }
            }
        });
    }

    /**
     * Computes the width and the height of the component.
     *
     * @returns {{
     *  height: number,
     *  width: number
     * }}
     */
    getDimensions() {
        const { clientHeight, clientWidth, filmstripVisible, filmstripWidth } = this.props;

        let width;
        let height;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            if (filmstripVisible) {
                width = `${clientWidth - filmstripWidth}px`;
            } else {
                width = `${clientWidth}px`;
            }
            height = `${clientHeight - getToolboxHeight()}px`;
        } else {
            if (filmstripVisible) {
                height = `${clientHeight - Filmstrip.getFilmstripHeight()}px`;
            } else {
                height = `${clientHeight}px`;
            }
            width = `${clientWidth}px`;
        }

        return {
            width,
            height
        };
    }

    /**
     * Retrieves the manager to be used for playing the shared video.
     *
     * @returns {Component}
     */
    getManager() {
        const { videoUrl } = this.props;

        if (!videoUrl) {
            return null;
        }

        if (videoUrl.match(/http/)) {
            return <VideoManager videoId = { videoUrl } />;
        }

        return <YoutubeVideoManager videoId = { videoUrl } />;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    override render() {
        // Always show the WHEP stream in the large video container
        const style: any = this.getDimensions();

        return (
            <div
                className = { (this.props.isResizing && 'disable-pointer') || '' }
                id = 'sharedVideo'
                style = { style }>
                <video
                    autoPlay = { true }
                    controls = { true }
                    id = 'sharedVideoPlayer1'
                    muted = { true }
                    playsInline = { true }
                    ref = { this.videoRef }
                    style = {{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, background: '#000' }} />
            </div>
        );
    }
}


/**
 * Maps (parts of) the Redux state to the associated LargeVideo props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { videoUrl } = state['features/shared-video'];
    const { clientHeight, videoSpaceWidth } = state['features/base/responsive-ui'];
    const { visible, isResizing } = state['features/filmstrip'];
    const { isResizing: isChatResizing } = state['features/chat'];
    const onStage = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedVideo;
    const isVideoShared = isVideoPlaying(state);

    return {
        clientHeight,
        clientWidth: videoSpaceWidth,
        filmstripVisible: visible,
        filmstripWidth: getVerticalViewMaxWidth(state),
        isEnabled: isSharedVideoEnabled(state),
        isResizing: isResizing || isChatResizing,
        isVideoShared,
        onStage,
        videoUrl
    };
}

export default connect(_mapStateToProps)(SharedVideo);

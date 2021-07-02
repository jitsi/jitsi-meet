// @flow

import React, { Component } from 'react';
import { RTCView } from 'react-native-webrtc';

import { Pressable } from '../../../react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import EventEmitter from './EventEmitter';
import VideoTransform from './VideoTransform';
import styles from './styles';
import { connect } from 'react-redux';
import { storeVideoTransform } from '../../actions';

/**
 * The type of the React {@code Component} props of {@link Video}.
 */
type Props = {
    mirror: boolean,

    onPlaying: Function,

    /**
     * Callback to invoke when the {@code Video} is clicked/pressed.
     */
    onPress: Function,

    stream: Object,

    /**
     * Similarly to the CSS property z-index, specifies the z-order of this
     * Video in the stacking space of all Videos. When Videos overlap,
     * zOrder determines which one covers the other. A Video with a larger
     * zOrder generally covers a Video with a lower one.
     *
     * Non-overlapping Videos may safely share a z-order (because one does
     * not have to cover the other).
     *
     * The support for zOrder is platform-dependent and/or
     * implementation-specific. Thus, specifying a value for zOrder is to be
     * thought of as giving a hint rather than as imposing a requirement.
     * For example, video renderers such as Video are commonly implemented
     * using OpenGL and OpenGL views may have different numbers of layers in
     * their stacking space. Android has three: a layer below the window
     * (aka default), a layer below the window again but above the previous
     * layer (aka media overlay), and above the window. Consequently, it is
     * advisable to limit the number of utilized layers in the stacking
     * space to the minimum sufficient for the desired display. For example,
     * a video call application usually needs a maximum of two zOrder
     * values: 0 for the remote video(s) which appear in the background, and
     * 1 for the local video(s) which appear above the remote video(s).
     */
    zOrder: number,

    /**
     * Indicates whether zooming (pinch to zoom and/or drag) is enabled.
     */
    zoomEnabled: boolean
};

/**
 * The React Native {@link Component} which is similar to Web's
 * {@code HTMLVideoElement} and wraps around react-native-webrtc's
 * {@link RTCView}.
 */
export default class Video extends Component<Props> {

    constructor(props) {
        super(props);
        this.state = {
            // --- for android to trigger snapshot on remote RTCView
            remoteVideoViewSnapshotOption: null,
            // --- for ios to control whether should render full screen remote view
            hideAllViewExceptRemoteRTCView: false,
        }
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        // RTCView currently does not support media events, so just fire
        // onPlaying callback when <RTCView> is rendered.
        const { onPlaying } = this.props;

        onPlaying && onPlaying();
        EventEmitter.addListener('WebRTCViewSnapshotResult', this.onWebRTCViewSnapshotResult);
        EventEmitter.addListener('TakeSnapshot', this.onPressTakeSnapshot);

    }

    onWebRTCViewSnapshotResult(data) {
        console.log("got the data back");
        
        if (data.error) {
            // --- failed
            console.log("got the data back"+data.error);
            
        }
        if (data.file) {
            storeVideoTransform.
            // --- saved file path
            console.log("got the data back"+data.file);
        }
    }


    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const { onPress, stream, zoomEnabled } = this.props;

        if (stream) {
            // RTCView
            const style = styles.video;
            const objectFit
                = zoomEnabled
                    ? 'contain'
                    : (style && style.objectFit) || 'cover';
            const rtcView
                = (
                    <RTCView
                        mirror = { this.props.mirror }
                        objectFit = { objectFit }
                        streamURL = { stream.toURL() }
                        style = { style }
                        zOrder = { this.props.zOrder }
                        snapshotOption={(stream.toURL() ? this.state.remoteVideoViewSnapshotOption : null)}/>
                        
                );

            // VideoTransform implements "pinch to zoom". As part of "pinch to
            // zoom", it implements onPress, of course.
            if (zoomEnabled) {
                return (
                    <VideoTransform
                        enabled = { zoomEnabled }
                        onPress = { onPress }
                        streamId = { stream.id }
                        style = { style }>
                        { rtcView }
                    </VideoTransform>
                );
            }

            // XXX Unfortunately, VideoTransform implements a custom press
            // detection which has been observed to be very picky about the
            // precision of the press unlike the builtin/default/standard press
            // detection which is forgiving to imperceptible movements while
            // pressing. It's not acceptable to be so picky, especially when
            // "pinch to zoom" is not enabled.
            return (
                <Pressable onPress = { onPress }>
                    { rtcView }
                </Pressable>
            );
        }

        // RTCView has peculiarities which may or may not be platform specific.
        // For example, it doesn't accept an empty streamURL. If the execution
        // reached here, it means that we explicitly chose to not initialize an
        // RTCView as a way of dealing with its idiosyncrasies.
        return null;
    }

    async onPressTakeSnapshot() {
        if (PlatformOS.platform === 'android') {
                
                // --- if snapshotOption != null and changed, the remote RTCView will trigger snapshot once and fire an event for result.
                let snapshotOption = {
                    id: "21213", // --- use any value you think it's unique for each screenshot
                    saveTarget: 'temp',
                };
                this.setState({ remoteVideoViewSnapshotOption: snapshotOption });
        } else {
            // IOS
            // --- optional: if you want full screen remote view only, take snapshot after you've adjust your views
            // this.setState({ hideAllViewExceptRemoteRTCView: true }, async () => {
            //         captureScreen = require("react-native-view-shot").captureScreen;
            //         CameraRoll = require("@react-native-community/cameraroll");

            //         let uriCache = await captureScreen({ format: 'jpg' });
            //         if (!uriCache) {
            //             return false;
            //         }
            //         let uriSaved = CameraRoll.saveToCameraRoll(uriCacheRenamed, 'photo');

            //         // --- optional: recover your view setup
            //         this.setState({ hideAllViewExceptRemoteRTCView: false });
            // }
        }
    }
}

import React, { useEffect, useRef } from 'react';
import { GestureResponderEvent, ViewStyle } from 'react-native';
import { MediaStream, RTCPIPView, startIOSPIP, stopIOSPIP } from 'react-native-webrtc';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import Pressable from '../../../react/components/native/Pressable';
import logger from '../../logger';

import VideoTransform from './VideoTransform';
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link Video}.
 */
interface IProps {

    /**
     * IOS component for PiP view.
     */
    fallbackView: React.Component;

    mirror: boolean;

    onPlaying: Function;

    /**
     * Callback to invoke when the {@code Video} is clicked/pressed.
     */
    onPress?: (event: GestureResponderEvent) => void;

    stream: MediaStream;

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
    zOrder?: number;

    /**
     * Indicates whether zooming (pinch to zoom and/or drag) is enabled.
     */
    zoomEnabled: boolean;
}

/**
 * The React Native {@link Component} which is similar to Web's
 * {@code HTMLVideoElement} and wraps around react-native-webrtc's
 * {@link RTCPIPView}.
 */
const Video: React.FC<IProps> = ({ fallbackView, mirror, onPlaying, onPress, stream, zoomEnabled, zOrder }: IProps) => {
    const { enableIosPIP } = useSelector((state: IReduxState) => state['features/mobile/picture-in-picture']);

    const iosPIPOptions = {
        fallbackView,
        preferredSize: {
            width: 400,
            height: 800
        },
        startAutomatically: true
    };
    const objectFit = zoomEnabled ? 'contain' : 'cover';
    const viewRef = useRef();

    const rtcView = (
        <RTCPIPView
            iosPIP = { iosPIPOptions }
            mirror = { mirror }
            objectFit = { objectFit }
            ref = { viewRef }
            streamURL = { stream?.toURL() }
            style = { styles.video as ViewStyle }
            zOrder = { zOrder } />
    );

    useEffect(() => {
        // RTCView currently does not support media events, so just fire
        // onPlaying callback when <RTCView> is rendered.
        onPlaying?.();
    }, []);

    useEffect(() => {
        if (enableIosPIP) {
            logger.warn('Picture in picture mode on');
            startIOSPIP(viewRef);
        } else {
            logger.warn('Picture in picture mode off');
            stopIOSPIP(viewRef);
        }
    }, [ enableIosPIP ]);

    // VideoTransform implements "pinch to zoom". As part of "pinch to
    // zoom", it implements onPress, of course.
    if (zoomEnabled) {
        return (
            <VideoTransform
                enabled = { zoomEnabled }
                onPress = { onPress }
                streamId = { stream?.id }
                style = { styles.video as ViewStyle }>
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

};

// @ts-ignore
export default Video;

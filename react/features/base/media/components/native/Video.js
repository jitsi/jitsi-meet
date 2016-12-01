import React, { Component } from 'react';
import { Platform, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';

import { styles } from './styles';

/**
 * Indicates whether RTCView (is to be considered that it) natively supports
 * i.e. implements mirroring the video it renders. If false, a workaround will
 * be used in an attempt to support mirroring in Video. If RTCView does not
 * implement mirroring on a specific platform but the workaround causes issues,
 * set to true for that platform to disable the workaround.
 */
const RTCVIEW_SUPPORTS_MIRROR = Platform.OS === 'android';

/**
 * The React Native component which is similar to Web's video element and wraps
 * around react-native-webrtc's RTCView.
 */
export class Video extends Component {
    /**
     * Video component's property types.
     *
     * @static
     */
    static propTypes = {
        mirror: React.PropTypes.bool,
        muted: React.PropTypes.bool,
        onPlaying: React.PropTypes.func,
        stream: React.PropTypes.object,

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
         * their stacking space. Android has three: a layer bellow the window
         * (aka default), a layer bellow the window again but above the previous
         * layer (aka media overlay), and above the window. Consequently, it is
         * advisable to limit the number of utilized layers in the stacking
         * space to the minimum sufficient for the desired display. For example,
         * a video call application usually needs a maximum of two zOrder
         * values: 0 for the remote video(s) which appear in the background, and
         * 1 for the local video(s) which appear above the remote video(s).
         */
        zOrder: React.PropTypes.number
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        // RTCView currently does not support media events, so just fire
        // onPlaying callback when <RTCView> is rendered.
        if (this.props.onPlaying) {
            this.props.onPlaying();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const stream = this.props.stream;

        if (stream) {
            const streamURL = stream.toURL();

            // XXX The CSS style object-fit that we utilize on Web is not
            // supported on React Native. Adding objectFit to React Native's
            // StyleSheet appears to be impossible without hacking and an
            // unjustified amount of effort. Consequently, I've chosen to define
            // objectFit on RTCView itself. Anyway, prepare to accommodate a
            // future definition of objectFit in React Native's StyleSheet.
            const style = styles.video;
            const objectFit = (style && style.objectFit) || 'cover';

            const mirror = this.props.mirror;

            // XXX RTCView doesn't currently support mirroring, even when
            // providing a transform style property. As a workaround, wrap the
            // RTCView inside another View and apply the transform style
            // property to that View instead.
            const mirrorWorkaround = mirror && !RTCVIEW_SUPPORTS_MIRROR;

            // eslint-disable-next-line no-extra-parens
            const video = (
                <RTCView
                    mirror = { !mirrorWorkaround }
                    objectFit = { objectFit }
                    streamURL = { streamURL }
                    style = { style }
                    zOrder = { this.props.zOrder } />
            );

            if (mirrorWorkaround) {
                return (
                    <View style = { styles.mirroredVideo }>{ video }</View>
                );
            }

            return video;
        }

        // RTCView has peculiarities which may or may not be platform specific.
        // For example, it doesn't accept an empty streamURL. If the execution
        // reached here, it means that we explicitly chose to not initialize an
        // RTCView as a way of dealing with its idiosyncrasies.
        return null;
    }
}

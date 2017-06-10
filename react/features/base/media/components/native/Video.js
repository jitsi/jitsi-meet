/* @flow */

import React, { Component } from 'react';
import { RTCView } from 'react-native-webrtc';

import styles from './styles';

/**
 * The React Native {@link Component} which is similar to Web's
 * {@code HTMLVideoElement} and wraps around react-native-webrtc's
 * {@link RTCView}.
 */
export default class Video extends Component {
    /**
     * {@code Video} component's property types.
     *
     * @static
     */
    static propTypes = {
        mirror: React.PropTypes.bool,
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
    };

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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const { stream } = this.props;

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

            // eslint-disable-next-line no-extra-parens
            return (
                <RTCView
                    mirror = { this.props.mirror }
                    objectFit = { objectFit }
                    streamURL = { streamURL }
                    style = { style }
                    zOrder = { this.props.zOrder } />
            );
        }

        // RTCView has peculiarities which may or may not be platform specific.
        // For example, it doesn't accept an empty streamURL. If the execution
        // reached here, it means that we explicitly chose to not initialize an
        // RTCView as a way of dealing with its idiosyncrasies.
        return null;
    }
}

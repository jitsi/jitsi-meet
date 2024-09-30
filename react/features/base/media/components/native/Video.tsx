import React, {Component, RefObject} from 'react';
import { GestureResponderEvent } from 'react-native';
import { connect } from 'react-redux';

import { MediaStream, RTCPIPView, startIOSPIP, stopIOSPIP } from 'react-native-webrtc';

import { IReduxState}  from '../../../../app/types';
import { translate } from '../../../i18n/functions';
import Pressable from '../../../react/components/native/Pressable';

import logger from '../../logger';

import VideoTransform from './VideoTransform';
import styles from './styles';
import FallbackView from "./FallbackView";


/**
 * The type of the React {@code Component} props of {@link Video}.
 */
interface IProps {

    _enableIosPIP?: boolean;

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
 * {@link RTCView}.
 */
class Video extends Component<IProps> {

    _ref: RefObject<typeof Video>;

    constructor(props) {
        super(props);
        this._ref = React.createRef();
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

        onPlaying?.();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const { _enableIosPIP, onPress, stream, zoomEnabled } = this.props;

        const iosPIPOptions = {
            startAutomatically: true,
            fallbackView: (<FallbackView />),
            preferredSize: {
                width: 400,
                height: 800,
            }
        }

        if (_enableIosPIP) {
            console.log('TESTING _enableIosPIP is', _enableIosPIP);
            console.log(this._ref?.current, 'Picture in picture mode on');
            // logger.warn(this._ref?.current, `Picture in picture mode on`);
            // startIOSPIP(this._ref?.current);
        } else {
            console.log('TESTING _enableIosPIP is', _enableIosPIP);
            console.log('TESTING Picture in picture mode off');
            // logger.warn(`Picture in picture mode off`);
            // stopIOSPIP(this._ref?.current);
        }

        if (stream) {
            // RTCView
            const style = styles.video;
            const objectFit
                = zoomEnabled
                    ? 'contain'
                    : 'cover';
            const rtcView
                = (
                    <RTCPIPView
                        iosPIP = { iosPIPOptions }
                        mirror = { this.props.mirror }
                        objectFit = { objectFit }
                        ref = { this._ref }
                        streamURL = { stream.toURL() }
                        style = { style }
                        zOrder = { this.props.zOrder } />
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
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    const iosPIP = state['features/mobile/picture-in-picture']?.enableIosPIP

    return {
        _enableIosPIP: iosPIP
    };
}

// @ts-ignore
export default translate(connect(_mapStateToProps)(Video));

import React, { Component } from 'react';

/**
 * The React Native component which is similar to Web's audio element and wraps
 * around react-native-webrtc's RTCView.
 */
export class Audio extends Component {
    /**
     * Audio component's property types.
     *
     * @static
     */
    static propTypes = {
        muted: React.PropTypes.bool,
        stream: React.PropTypes.object
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null}
     */
    render() {
        // TODO react-native-webrtc's RTCView doesn't do anything with the audio
        // MediaStream specified to it so it's easier at the time of this
        // writing to not render anything.
        return null;
    }
}

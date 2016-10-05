import React, { Component } from 'react';

import { styles } from './styles';

/**
 * Web version of Audio component.
 * @extends Component
 */
export class Video extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    render() {
        const stream = this.props.stream;

        if (stream) {
            // TODO URL.releaseObjectURL on componentDid/WillUnmount
            const src = URL.createObjectURL(stream);
            const style
                = this.props.mirror ? styles.mirroredVideo : styles.video;

            return (
                <video
                    autoPlay = { true }
                    muted = { this.props.muted }
                    onPlaying = { this.props.onPlaying }
                    src = { src }
                    style = { style } />
            );
        }

        return null;
    }

    /**
     * Implements shouldComponentUpdate of React Component. We don't update
     * component if stream has not changed.
     *
     * @inheritdoc
     * @param {Object} nextProps - Props that component is going to receive.
     * @returns {boolean}
     */
    shouldComponentUpdate(nextProps) {
        return (nextProps.stream || {}).id !== (this.props.stream || {}).id;
    }
}

/**
 * Video component's property types.
 *
 * @static
 */
Video.propTypes = {
    mirror: React.PropTypes.bool,
    muted: React.PropTypes.bool,
    onPlaying: React.PropTypes.func,
    stream: React.PropTypes.object,

    /**
     * Not used on Web. Introduced for the benefit of React Native. For more
     * details, refer to the zOrder property of the Video class for React
     * Native (i.e. ../native/Video.js).
     */
    zOrder: React.PropTypes.number
};

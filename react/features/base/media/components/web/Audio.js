import React, { Component } from 'react';

/**
 * The React equivalent of Web's audio element.
 *
 * @extends Component
 */
export class Audio extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // TODO URL.releaseObjectURL on componentDid/WillUnmount
        const src = this.props.stream
            ? URL.createObjectURL(this.props.stream)
            : '';

        return (
            <audio
                autoPlay = { true }
                muted = { this.props.muted }
                src = { src } />
        );
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
 * Audio component's property types.
 *
 * @static
 */
Audio.propTypes = {
    muted: React.PropTypes.bool,
    stream: React.PropTypes.object
};

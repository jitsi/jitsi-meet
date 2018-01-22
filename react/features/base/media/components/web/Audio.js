/* @flow */

import React from 'react';
import { connect } from 'react-redux';

import AbstractAudio, { _mapDispatchToProps } from '../AbstractAudio';

/**
 * The React/Web {@link Component} which is similar to and wraps around
 * {@code HTMLAudioElement} in order to facilitate cross-platform source code.
 */
class Audio extends AbstractAudio {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <audio
                preload = 'auto'
                ref = { this.setAudioElementImpl }
                src = { this.props.src } />
        );
    }
}

export default connect(null, _mapDispatchToProps)(Audio);

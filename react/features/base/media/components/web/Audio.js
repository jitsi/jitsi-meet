/* @flow */

import AbstractAudio from '../AbstractAudio';

/**
 * The React/Web {@link Component} which is similar to and wraps around
 * {@code HTMLAudioElement} in order to facilitate cross-platform source code.
 */
export default class Audio extends AbstractAudio {
    /**
     * {@code Audio} component's property types.
     *
     * @static
     */
    static propTypes = AbstractAudio.propTypes;

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return super._render('audio');
    }
}

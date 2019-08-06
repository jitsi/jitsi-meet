// @flow

import { Component } from 'react';

export type Props = {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Abstract class for the {@code VideoQualityLabel} component.
 */
export default class AbstractVideoQualityLabel<P: Props> extends Component<P> {

}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractVideoQualityLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const { enabled: audioOnly } = state['features/base/audio-only'];

    return {
        _audioOnly: audioOnly
    };
}

import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';

export interface IProps extends WithTranslation {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: boolean;
}

/**
 * Abstract class for the {@code VideoQualityLabel} component.
 */
export default class AbstractVideoQualityLabel<P extends IProps> extends Component<P> {

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
export function _abstractMapStateToProps(state: IReduxState) {
    const { enabled: audioOnly } = state['features/base/audio-only'];

    return {
        _audioOnly: audioOnly
    };
}

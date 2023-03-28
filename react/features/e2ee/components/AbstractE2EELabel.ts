import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';

export interface IProps extends WithTranslation {

    /**
     * Custom e2ee labels.
     */
    _e2eeLabels?: any;

    /**
     * True if the label needs to be rendered, false otherwise.
     */
    _showLabel?: boolean;
}

/**
 * Maps (parts of) the redux state to the associated props of this {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    const { e2ee = {} } = state['features/base/config'];

    return {
        _e2eeLabels: e2ee.labels,
        _showLabel: state['features/base/participants'].numberOfParticipantsDisabledE2EE === 0
    };
}

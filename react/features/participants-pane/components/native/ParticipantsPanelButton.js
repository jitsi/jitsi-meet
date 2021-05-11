// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { IconParticipants } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};


/**
 * Implements an {@link AbstractButton} to open the participants panel.
 */
class ParticipantsPanelButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconParticipants;
    label = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the participants panel.
     *
     * @private
     * @returns {void}
     */
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Props}
 */
function mapStateToProps(state: Object) {

    return {
        state
    };
}

export default translate(connect(mapStateToProps)(ParticipantsPanelButton));

// @flow

import type { Dispatch } from 'redux';

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconParticipants } from '../../../base/icons';
import { setActiveModalId } from '../../../base/modal';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import {
    PARTICIPANTS_PANE_ID
} from '../../../invite/constants';

import { ParticipantsPane } from './';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};


/**
 * Implements an {@link AbstractButton} to open the participants panel.
 */
class ParticipantsPaneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconParticipants;
    label = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the participants panel.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openDialog(ParticipantsPane));
        this.props.dispatch(setActiveModalId(PARTICIPANTS_PANE_ID));
    }
}

export default translate(connect()(ParticipantsPaneButton));

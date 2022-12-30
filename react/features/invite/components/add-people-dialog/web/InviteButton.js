// @flow

import { createToolbarEvent, sendAnalytics } from '../../../../analytics';
import { translate } from '../../../../base/i18n';
import { IconAddUser } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../../base/toolbox/components';
import { beginAddPeople } from '../../../actions.any';
import {isLocalParticipantModerator} from '../../../../base/participants/functions';

/**
 * The type of the React {@code Component} props of {@link EmbedMeetingButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implementation of a button for opening invite people dialog.
 */
class InviteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    icon = IconAddUser;
    label = 'toolbar.invite';
    tooltip = 'toolbar.invite';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('invite'));
        dispatch(beginAddPeople());
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    return {
        visible: isLocalParticipantModerator(state)
    };
}

export default translate(connect(_mapStateToProps)(InviteButton));

// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../../../base/i18n';
import { IconAddPeople } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import { AbstractButton } from '../../../../base/toolbox';
import type { AbstractButtonProps } from '../../../../base/toolbox';

import { doInvitePeople } from '../../../actions.native';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Dispatch<any>
};

/**
 * Implements an {@link AbstractButton} to enter add/invite people to the
 * current call/conference/meeting.
 */
class InviteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shareRoom';
    icon = IconAddPeople;
    label = 'toolbar.shareRoom';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(doInvitePeople());
    }
}


export default translate(connect()(InviteButton));

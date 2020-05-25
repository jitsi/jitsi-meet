// @flow

import type { Dispatch } from 'redux';

import { getFeatureFlag, INVITE_ENABLED } from '../../../../base/flags';
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

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps: Props) {
    const { disableInviteFunctions } = state['features/base/config'];
    const flag = getFeatureFlag(state, INVITE_ENABLED, true);

    return {
        visible: flag && !disableInviteFunctions && ownProps.visible
    };
}


export default translate(connect(_mapStateToProps)(InviteButton));

// @flow

import type { Dispatch } from 'redux';

import { getFeatureFlag, INVITE_ENABLED } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import { IconAddPeople } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import { AbstractButton } from '../../../../base/toolbox';
import type { AbstractButtonProps } from '../../../../base/toolbox';
import { beginShareRoom } from '../../../../share-room';

import { setAddPeopleDialogVisible } from '../../../actions';
import { isAddPeopleEnabled, isDialOutEnabled } from '../../../functions';

type Props = AbstractButtonProps & {

    /**
     * Whether the (backend) add people feature is enabled or not.
     */
    _addPeopleEnabled: boolean,

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
        const { _addPeopleEnabled, dispatch } = this.props;

        if (_addPeopleEnabled) {
            dispatch(setAddPeopleDialogVisible(true));
        } else {
            dispatch(beginShareRoom());
        }
    }
}

/**
 * Maps (parts of) the redux state to {@link InviteButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: Object) {
    const addPeopleEnabled = getFeatureFlag(state, INVITE_ENABLED, true)
        && (isAddPeopleEnabled(state) || isDialOutEnabled(state));

    return {
        _addPeopleEnabled: addPeopleEnabled
    };
}

export default translate(connect(_mapStateToProps)(InviteButton));

// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { AbstractButton } from '../../../../base/toolbox';
import type { AbstractButtonProps } from '../../../../base/toolbox';

import { setAddPeopleDialogVisible } from '../../../actions';
import { isAddPeopleEnabled, isDialOutEnabled } from '../../../functions';

type Props = AbstractButtonProps & {

    /**
     * Whether or not the feature to invite people to join the
     * conference is available.
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
    iconName = 'icon-link';
    label = 'toolbar.shareRoom';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(setAddPeopleDialogVisible(true));
    }

    /**
     * Returns true if none of the invite methods are available.
     *
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._addPeopleEnabled;
    }
}

/**
 * Maps (parts of) the redux state to {@link InviteButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *   _addPeopleEnabled: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _addPeopleEnabled: isAddPeopleEnabled(state) || isDialOutEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(InviteButton));

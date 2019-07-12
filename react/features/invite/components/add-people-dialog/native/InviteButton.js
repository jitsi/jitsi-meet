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
}

/**
 * Maps (parts of) the redux state to {@link InviteButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Object) {
    const addPeopleEnabled = isAddPeopleEnabled(state) || isDialOutEnabled(state);
    const { visible = Boolean(addPeopleEnabled) } = ownProps;

    return {
        visible
    };
}

export default translate(connect(_mapStateToProps)(InviteButton));

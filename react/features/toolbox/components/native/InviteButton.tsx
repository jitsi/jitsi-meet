
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconAddUser } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { doInvitePeople } from '../../../invite/actions.native';

/**
 * The type of the React {@code Component} props of {@link InviteButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function;
}

/**
 * An implementation of a button to start the invite people flow.
 */
class InviteButton extends AbstractButton<IProps, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    icon = IconAddUser;
    label = 'toolbar.invite';

    /**
     * Handles clicking / pressing the button.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(doInvitePeople());
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code InviteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        visible: true
    };
}

export default translate(connect(_mapStateToProps)(InviteButton));

// @flow

import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { toggleChat } from '../actions';

type Props = AbstractButtonProps & {

    /**
     * Display Chat.
     *
     * @protected
     */
    _onDisplayChat: Function
};

/**
 * Implements an {@link AbstractButton} to enter add/invite people to the
 * current call/conference/meeting.
 */
class ChatButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.chat';
    iconName = 'chat';
    label = '';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props._onDisplayChat();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        return (
            super.render()
        );
    }
}

/**
 * Maps redux actions to {@link InviteButton}'s React
 * {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _onAddPeople,
 *     _onShareRoom
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Dispatch<*>) {
    return {
        /**
         * Launches native invite dialog.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onDisplayChat() {
            dispatch(toggleChat());
        }
    };
}

export default connect(null, _mapDispatchToProps)(ChatButton);

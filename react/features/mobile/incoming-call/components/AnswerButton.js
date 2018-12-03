// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import { incomingCallAnswered } from '../actions';

/**
 * The type of the React {@code Component} props of {@link AnswerButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button which accepts/answers an incoming call.
 */
class AnswerButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'incomingCall.answer';
    iconName = 'hangup';
    label = 'incomingCall.answer';

    /**
     * Handles clicking / pressing the button, and answers the incoming call.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(incomingCallAnswered());
    }
}

export default translate(connect()(AnswerButton));

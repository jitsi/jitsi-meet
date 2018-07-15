// @flow

import { connect } from 'react-redux';

import { AbstractButton } from '../../../base/toolbox';
import { translate } from '../../../base/i18n';
import type { AbstractButtonProps } from '../../../base/toolbox';

import { incomingCallDeclined } from '../actions';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button which rejects an incoming call.
 */
class DeclineButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'incomingCall.decline';
    iconName = 'hangup';
    label = 'incomingCall.decline';

    /**
     * Handles clicking / pressing the button, and declines the incoming call.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(incomingCallDeclined());
    }

}

export default translate(connect()(DeclineButton));

// @flow

import { translate } from '../../../base/i18n';
import { IconHangup } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import { incomingCallDeclined } from '../actions';

/**
 * The type of the React {@code Component} props of {@link DeclineButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An implementation of a button which declines/rejects an incoming call.
 */
class DeclineButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'incomingCall.decline';
    icon = IconHangup;
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

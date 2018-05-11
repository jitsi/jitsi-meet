// @flow

import { connect } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app';
import { disconnect } from '../../base/connection';
import { translate } from '../../base/i18n';
import { AbstractHangupButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';

/**
 * The type of the React {@code Component} props of {@link HangupButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends AbstractHangupButton
 */
class HangupButton extends AbstractHangupButton<Props, *> {
    label = 'toolbar.hangup';
    tooltip = 'toolbar.hangup';

    /**
     * Helper function to perform the actual hangup action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _doHangup() {
        sendAnalytics(createToolbarEvent('hangup'));

        // FIXME: these should be unified.
        if (navigator.product === 'ReactNative') {
            this.props.dispatch(appNavigate(undefined));
        } else {
            this.props.dispatch(disconnect(true));
        }
    }
}

export default translate(connect()(HangupButton));

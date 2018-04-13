// @flow

import { connect } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { appNavigate } from '../../../app';

import { disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';

import AbstractHangupButton from './AbstractHangupButton';
import type { Props as AbstractButtonProps } from './AbstractButton';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

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
     * @private
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

    /**
     * Indicates if this button should be disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }
}

export default translate(connect()(HangupButton));

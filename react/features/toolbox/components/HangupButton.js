// @flow

import _ from 'lodash';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app/actions';
import { disconnect } from '../../base/connection';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { AbstractHangupButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';
import { ScreenShareController } from './native/IOSRecordButton';
import { jitsiLocalStorage } from '@jitsi/js-utils';
import {clearSessionId, unmarkClearSessionId} from '../../base/conference';
import { Platform } from 'react-native';


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
    _hangup: Function;

    accessibilityLabel = 'toolbar.accessibilityLabel.hangup';
    label = 'toolbar.hangup';
    tooltip = 'toolbar.hangup';

    /**
     * Initializes a new HangupButton instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._hangup = _.once(() => {
            if (Platform.OS == 'ios') {
                this.props.dispatch({ type: 'END_SCREEN_SHARING' });
                ScreenShareController.stopRecording();
            }
            sendAnalytics(createToolbarEvent('hangup'));
            if (jitsiLocalStorage.getItem('clearSessionId') === 'true') {
                this.props.dispatch(clearSessionId());
                this.props.dispatch(unmarkClearSessionId());
            }
            jitsiLocalStorage.removeItem('showScreenshare')
            // FIXME: these should be unified.
            if (navigator.product === 'ReactNative') {
                this.props.dispatch(appNavigate(undefined));
            } else {
                this.props.dispatch(disconnect(true));
            }
        });
    }

    /**
     * Helper function to perform the actual hangup action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _doHangup() {
        this._hangup();
    }
}

export default translate(connect()(HangupButton));

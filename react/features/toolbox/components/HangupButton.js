// @flow

import _ from 'lodash';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app/actions';
import { disconnect } from '../../base/connection';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { AbstractHangupButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';
const {ScreenShareController} =  require('./native/IOSRecordButton');
import { jitsiLocalStorage } from '@jitsi/js-utils';
import { Platform } from 'react-native';

import { CLOSING_PAGE_MODAL_ID } from '../../closingpage/constants';
import { setActiveModalId } from '../../base/modal';



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

        const protocol = this.props.locationURL.protocol
        const host = this.props.locationURL.host
        const serverURL = `${protocol}//${host}`
        console.log(serverURL)
        var shouldShowClosePage = JSON.parse(jitsiLocalStorage.getItem(['config.js/'+ serverURL+'/']))["enableClosePage"]
        if(shouldShowClosePage){
            this.props.dispatch(setActiveModalId(CLOSING_PAGE_MODAL_ID,serverURL));
            
        }

    }
}
function _mapStateToProps(state: Object): $Shape<Props> {
    const { locationURL } = state['features/base/connection'];

    return {
        locationURL
    };
}


export default translate(connect(_mapStateToProps)(HangupButton));

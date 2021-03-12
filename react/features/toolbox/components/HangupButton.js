// @flow

import _ from 'lodash';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app/actions';
import { disconnect } from '../../base/connection';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { AbstractHangupButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';
import { isJaneWaitingAreaEnabled, updateParticipantReadyStatus } from '../../jane-waiting-area-native/functions';

/**
 * The type of the React {@code Component} props of {@link HangupButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,
    isJaneWaitingAreaEnabled,
    appstate: string,
    jwt: string
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
            sendAnalytics(createToolbarEvent('hangup'));

            // FIXME: these should be unified.
            if (navigator.product === 'ReactNative') {
                if (props.isJaneWaitingAreaEnabled) {
                    updateParticipantReadyStatus(props.jwt, 'left');
                }
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

/**
 * Maps part of the Redux state to the props of the component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     appstate: string,
 *     jwtPayload: Object
 * }}
 */
function mapStateToProps(state): Object {
    const appstate = state['features/background'];

    return {
        appstate,
        jwt: state['features/base/jwt'],
        isJaneWaitingAreaEnabled: isJaneWaitingAreaEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(HangupButton));

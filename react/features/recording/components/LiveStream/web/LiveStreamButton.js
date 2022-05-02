// @flow

import { getToolbarButtons } from '../../../../base/config';
import { openDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractLiveStreamButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props
} from '../AbstractLiveStreamButton';

import {
    StartLiveStreamDialog,
    StopLiveStreamDialog
} from './index';


/**
 * Button for opening the live stream settings dialog.
 */
class LiveStreamButton extends AbstractLiveStreamButton<Props> {

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _onHandleClick() {
        const { _isLiveStreamRunning, dispatch } = this.props;

        dispatch(openDialog(
            _isLiveStreamRunning ? StopLiveStreamDialog : StartLiveStreamDialog
        ));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code LiveStreamButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isLiveStreamRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    const toolbarButtons = getToolbarButtons(state);
    let { visible } = ownProps;

    if (typeof visible === 'undefined') {
        visible = toolbarButtons.includes('livestreaming') && abstractProps.visible;
    }

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(LiveStreamButton));

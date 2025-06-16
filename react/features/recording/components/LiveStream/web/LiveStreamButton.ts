import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import AbstractLiveStreamButton, {
    IProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractLiveStreamButton';

import StartLiveStreamDialog from './StartLiveStreamDialog';
import StopLiveStreamDialog from './StopLiveStreamDialog';


/**
 * Button for opening the live stream settings dialog.
 */
class LiveStreamButton extends AbstractLiveStreamButton<IProps> {

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
 * @param {IProps} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isLiveStreamRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    const { toolbarButtons } = state['features/toolbox'];
    let { visible } = ownProps;

    if (typeof visible === 'undefined') {
        visible = Boolean(toolbarButtons?.includes('livestreaming') && abstractProps.visible);
    }

    return {
        ...abstractProps,
        visible
    };
}

export default translate(connect(_mapStateToProps)(LiveStreamButton));

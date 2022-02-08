// @flow

import { openDialog } from '../../../../base/dialog';
import { LIVE_STREAMING_ENABLED, getFeatureFlag } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { navigate }
    from '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../../mobile/navigation/routes';
import AbstractLiveStreamButton,
{ _mapStateToProps as _abstractMapStateToProps } from '../AbstractLiveStreamButton';
import type { Props } from '../AbstractStartLiveStreamDialog';

import { StopLiveStreamDialog } from './index';


/**
 * Button for opening the live stream settings screen.
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

        if (_isLiveStreamRunning) {
            dispatch(openDialog(StopLiveStreamDialog));
        } else {
            navigate(screen.conference.liveStream);
        }
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: Object, ownProps: Object) {
    const enabled = getFeatureFlag(state, LIVE_STREAMING_ENABLED, true);
    const abstractProps = _abstractMapStateToProps(state, ownProps);

    return {
        ...abstractProps,
        visible: enabled && abstractProps.visible
    };
}

export default translate(connect(mapStateToProps)(LiveStreamButton));

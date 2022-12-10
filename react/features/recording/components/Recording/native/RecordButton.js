// @flow

import { Platform } from 'react-native';

import { openDialog } from '../../../../base/dialog';
import { IOS_RECORDING_ENABLED, RECORDING_ENABLED, getFeatureFlag } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { navigate }
    from '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../../mobile/navigation/routes';
import type { Props } from '../../LiveStream/AbstractStartLiveStreamDialog';
import AbstractRecordButton,
{ _mapStateToProps as _abstractMapStateToProps } from '../AbstractRecordButton';

import { StopRecordingDialog } from './index';


/**
 * Button for opening a screen where a recording session can be started.
 */
class RecordButton extends AbstractRecordButton<Props> {

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _onHandleClick() {
        const { _isRecordingRunning, dispatch } = this.props;

        if (_isRecordingRunning) {
            dispatch(openDialog(StopRecordingDialog));
        } else {
            navigate(screen.conference.recording);
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
    const enabled = getFeatureFlag(state, RECORDING_ENABLED, true);
    const iosEnabled = Platform.OS !== 'ios' || getFeatureFlag(state, IOS_RECORDING_ENABLED, false);
    const abstractProps = _abstractMapStateToProps(state, ownProps);

    return {
        ...abstractProps,
        visible: enabled && iosEnabled && abstractProps.visible
    };
}

export default translate(connect(mapStateToProps)(RecordButton));

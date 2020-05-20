// @flow

import { Platform } from 'react-native';

import { IOS_RECORDING_ENABLED, RECORDING_ENABLED, getFeatureFlag } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import { IconToggleRecording } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import AbstractRecordButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props
} from '../AbstractRecordButton';

/**
 * An implementation of a button for starting and stopping recording.
 */
class RecordButton extends AbstractRecordButton<Props> {
    icon = IconToggleRecording;
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

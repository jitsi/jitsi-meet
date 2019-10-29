// @flow

import { translate } from '../../../../base/i18n';
import { IconToggleRecording } from '../../../../base/icons';
import { connect } from '../../../../base/redux';

import AbstractRecordButton, {
    _mapStateToProps,
    type Props
} from '../AbstractRecordButton';

/**
 * An implementation of a button for starting and stopping recording.
 */
class RecordButton extends AbstractRecordButton<Props> {
    icon = IconToggleRecording;
}

export default translate(connect(_mapStateToProps)(RecordButton));

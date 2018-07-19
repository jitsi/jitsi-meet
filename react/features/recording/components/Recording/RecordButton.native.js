// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import AbstractRecordButton, {
    _mapStateToProps,
    type Props
} from './AbstractRecordButton';

/**
 * An implementation of a button for starting and stopping recording.
 */
class RecordButton extends AbstractRecordButton<Props> {
    iconName = 'camera-take-picture';
    toggledIconName = 'camera-take-picture';
}

export default translate(connect(_mapStateToProps)(RecordButton));

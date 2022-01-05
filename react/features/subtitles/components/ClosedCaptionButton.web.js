// @flow

import { translate } from '../../base/i18n';
import { IconClosedCaption } from '../../base/icons';
import { connect } from '../../base/redux';

import {
    AbstractClosedCaptionButton,
    _abstractMapStateToProps
} from './AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
    extends AbstractClosedCaptionButton {

    accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    icon = IconClosedCaption;
    tooltip = 'transcribing.ccButtonTooltip';
    label = 'toolbar.startSubtitles';
    toggledLabel = 'toolbar.stopSubtitles';
}

export default translate(connect(_abstractMapStateToProps)(ClosedCaptionButton));

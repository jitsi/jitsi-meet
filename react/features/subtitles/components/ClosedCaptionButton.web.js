// @flow

import { connect } from 'react-redux';

import { translate } from '../../base/i18n/index';

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
    iconName = 'icon-closed_caption';
    toggledIconName = 'icon-closed_caption toggled';
    tooltip = 'transcribing.ccButtonTooltip';
    label = 'toolbar.startSubtitles';
    toggledLabel = 'toolbar.stopSubtitles';
}

export default translate(connect(_abstractMapStateToProps)(
    ClosedCaptionButton));

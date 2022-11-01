// @flow

import { translate } from '../../base/i18n';
import { IconSubtitles } from '../../base/icons';
import { connect } from '../../base/redux';
import { toggleLanguageSelectorDialog } from '../actions';

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
    icon = IconSubtitles;
    tooltip = 'transcribing.ccButtonTooltip';
    label = 'toolbar.startSubtitles';
    labelProps = {
        language: this.props.t(this.props._language),
        languages: this.props.t(this.props.languages),
        languagesHead: this.props.t(this.props.languagesHead)
    };

    /**
     * Toggle language selection dialog.
     *
     * @returns {void}
     */
    _handleClickOpenLanguageSelector() {
        const { dispatch } = this.props;

        dispatch(toggleLanguageSelectorDialog());
    }
}

export default translate(connect(_abstractMapStateToProps)(ClosedCaptionButton));

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconSubtitles } from '../../../base/icons/svg';
import { toggleLanguageSelectorDialog } from '../../actions.web';
import {
    AbstractClosedCaptionButton,
    _abstractMapStateToProps
} from '../AbstractClosedCaptionButton';
import { openSubtitlesPanel } from '../../../chat/actions.any';

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
        language: this.props.t(this.props._language ?? 'transcribing.subtitlesOff'),
        languages: this.props.t(this.props.languages ?? ''),
        languagesHead: this.props.t(this.props.languagesHead ?? '')
    };

    /**
     * Toggle language selection dialog.
     *
     * @returns {void}
     */
    _handleClickOpenLanguageSelector() {
        const { _isSubtitlesTabEnabled, dispatch } = this.props;

        if (_isSubtitlesTabEnabled) {
            dispatch(openSubtitlesPanel());
        } else {
            dispatch(toggleLanguageSelectorDialog());
        }
    }
}

export default translate(connect(_abstractMapStateToProps)(ClosedCaptionButton));

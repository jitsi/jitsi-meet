import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconSubtitles } from '../../../base/icons/svg';
import { toggleLanguageSelectorDialog } from '../../actions.web';
import {
    AbstractClosedCaptionButton,
    _abstractMapStateToProps
} from '../AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
    extends AbstractClosedCaptionButton {
    override accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    override icon = IconSubtitles;
    override tooltip = 'transcribing.ccButtonTooltip';
    override label = 'toolbar.startSubtitles';
    override labelProps = {
        language: this.props.t(this.props._language ?? 'transcribing.subtitlesOff'),
        languages: this.props.t(this.props.languages ?? ''),
        languagesHead: this.props.t(this.props.languagesHead ?? '')
    };

    /**
     * Toggle language selection dialog.
     *
     * @returns {void}
     */
    override _handleClickOpenLanguageSelector() {
        const { dispatch } = this.props;

        dispatch(toggleLanguageSelectorDialog());
    }
}

export default translate(connect(_abstractMapStateToProps)(ClosedCaptionButton));

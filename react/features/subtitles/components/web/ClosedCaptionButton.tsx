import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { DEFAULT_LANGUAGE } from '../../../base/i18n/i18next';
import { IconSubtitles } from '../../../base/icons/svg';
import { openCCPanel } from '../../../chat/actions.any';
import { getTranscriptionLanguage } from '../../../transcribing/functions';
import { setRequestingSubtitles } from '../../actions.any';
import { toggleLanguageSelectorDialog } from '../../actions.web';
import { canStartSubtitles, isCCTabEnabled, isTranslationEnabled } from '../../functions.any';
import {
    AbstractClosedCaptionButton,
    IAbstractProps,
    _abstractMapStateToProps
} from '../AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
    extends AbstractClosedCaptionButton {
    override icon = IconSubtitles;

    /**
     * Computes the label interpolation props from the current props on every render so the button
     * title stays in sync when subtitles are toggled (the button instance is not always remounted).
     * When subtitles are on without a translation language selected, the default transcription
     * (source) language is shown.
     *
     * @returns {Object}
     */
    override _getLabelProps() {
        const { t, _defaultLanguage, _language, _requestingSubtitles, languages, languagesHead } = this.props;

        return {
            language: t(_requestingSubtitles
                ? _language ?? `translation-languages:${_defaultLanguage}`
                : 'transcribing.subtitlesOff'),
            languages: t(languages ?? ''),
            languagesHead: t(languagesHead ?? '')
        };
    }

    /**
     * Gets the current button label based on the CC tab state.
     *
     * @returns {void}
     */
    override _getLabel() {
        const { _isCCTabEnabled } = this.props;

        return _isCCTabEnabled ? 'toolbar.closedCaptions' : 'toolbar.startSubtitles';
    }

    /**
     * Returns the accessibility label for the button.
     *
     * @returns {string} Accessibility label.
     */
    override _getAccessibilityLabel() {
        const { _isCCTabEnabled } = this.props;

        return _isCCTabEnabled ? 'toolbar.accessibilityLabel.closedCaptions' : 'toolbar.accessibilityLabel.cc';
    }

    /**
     * Returns the tooltip text based on the CC tab state.
     *
     * @returns {string} The tooltip text.
     */
    override _getTooltip() {
        const { _isCCTabEnabled } = this.props;

        return _isCCTabEnabled ? 'transcribing.openClosedCaptions' : 'transcribing.ccButtonTooltip';
    }

    /**
     * Toggle language selection dialog.
     *
     * @returns {void}
     */
    override _handleClickOpenLanguageSelector() {
        const { dispatch, _isCCTabEnabled, _isTranslationEnabled, _requestingSubtitles } = this.props;

        if (_isCCTabEnabled) {
            dispatch(openCCPanel());
        } else if (_isTranslationEnabled) {
            dispatch(toggleLanguageSelectorDialog());
        } else {
            // Translation is disabled, so the language selector dialog has nothing to display (it renders nothing).
            // Toggle the subtitles in the source language directly instead of opening an empty dialog.
            dispatch(setRequestingSubtitles(!_requestingSubtitles, !_requestingSubtitles, null));
        }
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The component's own props.
 * @returns {Object} Mapped props for the component.
 */
function mapStateToProps(state: IReduxState, ownProps: IAbstractProps) {
    const { visible = canStartSubtitles(state) || isCCTabEnabled(state) } = ownProps;

    const transcriptionLanguage = getTranscriptionLanguage(state['features/base/config']);

    return {
        ..._abstractMapStateToProps(state, {
            ...ownProps,
            visible
        }),

        // Strip the region from the BCP-47 locale (e.g. en-US -> en) to match the translation-languages keys.
        _defaultLanguage: transcriptionLanguage?.replace(/[-_].*/, '') ?? DEFAULT_LANGUAGE,
        _isTranslationEnabled: isTranslationEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(ClosedCaptionButton));

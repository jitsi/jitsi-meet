import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { AUDIO_TRANSLATION_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconTranslate } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { isAudioTranslationAvailable } from '../../functions';

interface IProps extends AbstractButtonProps {

    /**
     * The target language remote audio is currently translated into, or null.
     */
    _language: string | null;
}

/**
 * An overflow-menu button that opens the AI audio-translation language selector screen.
 */
class AudioTranslationButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.audioTranslation';
    override icon = IconTranslate;
    override label = 'toolbar.audioTranslation';

    /**
     * Handles clicking the button by opening the language selector screen.
     *
     * @override
     * @returns {void}
     */
    override _handleClick() {
        navigate(screen.conference.audioTranslation);
    }

    /**
     * Indicates whether this button is in the toggled (translation-on) state.
     *
     * @override
     * @returns {boolean}
     */
    override _isToggled() {
        return Boolean(this.props._language);
    }
}

/**
 * Maps (parts of) the redux state to the button's props.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _language: state['features/audio-translation'].language,
        visible: isAudioTranslationAvailable(state) && getFeatureFlag(state, AUDIO_TRANSLATION_ENABLED, true)
    };
}

export default translate(connect(_mapStateToProps)(AudioTranslationButton));

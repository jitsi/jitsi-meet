import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isAudioTranslationAvailable } from '../../../audio-translation/functions';
import { AUDIO_TRANSLATION_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconTranslate } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

interface IProps extends AbstractButtonProps {

    /**
     * The id of the participant the language selector targets.
     */
    participantID: string;
}

/**
 * A remote-participant menu button that opens the AI audio-translation language selector scoped to that
 * participant.
 */
class TranslateParticipantButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.audioTranslation';
    override icon = IconTranslate;
    override label = 'toolbar.audioTranslation';

    /**
     * Opens the language selector screen scoped to the participant.
     *
     * @override
     * @returns {void}
     */
    override _handleClick() {
        navigate(screen.conference.audioTranslation, { participantId: this.props.participantID });
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
        visible: isAudioTranslationAvailable(state) && getFeatureFlag(state, AUDIO_TRANSLATION_ENABLED, true)
    };
}

export default translate(connect(_mapStateToProps)(TranslateParticipantButton));

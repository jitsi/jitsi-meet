import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconSubtitles } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

import AudioTranslationDialog from './AudioTranslationDialog';

interface IProps extends AbstractButtonProps {

    /**
     * The target language remote audio is currently translated into, or null.
     */
    _language: string | null;
}

/**
 * A toolbar button that opens the AI audio-translation language selector.
 */
class AudioTranslationButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.audioTranslation';
    override icon = IconSubtitles;
    override label = 'toolbar.audioTranslation';
    override tooltip = 'toolbar.audioTranslation';

    /**
     * Handles clicking the button by opening the language selector dialog.
     *
     * @override
     * @returns {void}
     */
    override _handleClick() {
        this.props.dispatch(openDialog('AudioTranslationDialog', AudioTranslationDialog));
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
        _language: state['features/audio-translation'].language
    };
}

export default translate(connect(_mapStateToProps)(AudioTranslationButton));

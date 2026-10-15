import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconTranslate } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { isE2EEOnInMeeting } from '../../../e2ee/functions';

import AudioTranslationDialog from './AudioTranslationDialog';

interface IProps extends AbstractButtonProps {

    /**
     * Whether end-to-end encryption is on, which rules out live translation.
     */
    _e2eeEnabled: boolean;

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
    override icon = IconTranslate;
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

    /**
     * Disabled while end-to-end encryption is on, unless a translation is already on and can be turned off.
     *
     * @override
     * @returns {boolean}
     */
    override _isDisabled() {
        return Boolean(this.props._e2eeEnabled) && !this._isToggled();
    }

    /**
     * Why the button is disabled.
     *
     * @override
     * @returns {string}
     */
    override _getDisabledReason() {
        return 'audioTranslation.unavailableWithE2EE';
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
        _e2eeEnabled: isE2EEOnInMeeting(state),
        _language: state['features/audio-translation'].language
    };
}

export default translate(connect(_mapStateToProps)(AudioTranslationButton));

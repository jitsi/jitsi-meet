import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconSpeakerHighlight } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { toggleSpeakerHighlight } from '../../../speaker-highlight/actions';
import { isSpeakerHighlightEnabled } from '../../../speaker-highlight/functions';

/**
 * The type of the React {@code Component} props of {@link SpeakerHighlightButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether speaker highlighting is currently enabled.
     */
    _speakerHighlightEnabled: boolean;
}

/**
 * Component that renders a toolbar button for toggling speaker highlighting.
 */
class SpeakerHighlightButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.speakerHighlight';
    override icon = IconSpeakerHighlight;
    override label = 'toolbar.speakerHighlight';
    override tooltip = 'toolbar.speakerHighlight';

    /**
     * Handles clicking / pressing the button, and toggles speaker highlighting.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, _speakerHighlightEnabled } = this.props;
        
        // Log to console for debugging
        if (_speakerHighlightEnabled) {
            console.log('Speaker highlighting deaktiviert');
        } else {
            console.log('Speaker highlighting aktiviert');
        }
        
        // Dispatch the toggle action
        dispatch(toggleSpeakerHighlight());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._speakerHighlightEnabled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _speakerHighlightEnabled: isSpeakerHighlightEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(SpeakerHighlightButton)); 
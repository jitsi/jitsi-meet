import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { setAudioOnly, toggleAudioOnly } from '../../../base/audio-only/actions';
import { AUDIO_ONLY_BUTTON_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconAudioOnly, IconAudioOnlyOff } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import {
    navigate
} from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

/**
 * The type of the React {@code Component} props of {@link AudioOnlyButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether the current conference is in audio only mode or not.
     */
    _audioOnly: boolean;

    /**
     * Indicates whether the car mode is enabled.
     */
    _startCarMode?: boolean;
}

/**
 * An implementation of a button for toggling the audio-only mode.
 */
class AudioOnlyButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.audioOnly';
    override icon = IconAudioOnly;
    override label = 'toolbar.audioOnlyOn';
    override toggledIcon = IconAudioOnlyOff;
    override toggledLabel = 'toolbar.audioOnlyOff';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { _audioOnly, _startCarMode, dispatch } = this.props;

        if (!_audioOnly && _startCarMode) {
            dispatch(setAudioOnly(true));
            navigate(screen.conference.carmode);
        } else {
            dispatch(toggleAudioOnly());
        }
    }


    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._audioOnly;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AudioOnlyButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const enabledInFeatureFlags = getFeatureFlag(state, AUDIO_ONLY_BUTTON_ENABLED, true);
    const { startCarMode } = state['features/base/settings'];
    const { visible = enabledInFeatureFlags } = ownProps;

    return {
        _audioOnly: Boolean(audioOnly),
        _startCarMode: startCarMode,
        visible
    };
}

export default translate(connect(_mapStateToProps)(AudioOnlyButton));

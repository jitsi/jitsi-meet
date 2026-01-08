import { IReduxState } from '../../app/types';
import { AUDIO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import BaseAudioMuteButton from '../../base/toolbox/components/BaseAudioMuteButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import { muteLocal } from '../../video-menu/actions';
import { isAudioMuteButtonDisabled } from '../functions';


/**
 * The type of the React {@code Component} props of {@link AbstractAudioMuteButton}.
 */
export interface IProps extends AbstractButtonProps {


    /**
     * Whether audio is currently muted or not.
    */
    _audioMuted: boolean;

    /**
    * Whether the button is disabled.
   */
    _disabled: boolean;
}

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @augments BaseAudioMuteButton
 */
export default class AbstractAudioMuteButton<P extends IProps> extends BaseAudioMuteButton<P> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.mute';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.unmute';
    override label = 'toolbar.mute';
    override toggledLabel = 'toolbar.unmute';
    override tooltip = 'toolbar.mute';
    override toggledTooltip = 'toolbar.unmute';

    /**
     * Indicates if audio is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isAudioMuted() {
        return this.props._audioMuted;
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    override _setAudioMuted(audioMuted: boolean) {
        this.props.dispatch(muteLocal(audioMuted, MEDIA_TYPE.AUDIO));
    }

    /**
     * Return a boolean value indicating if this button is disabled or not.
     *
     * @returns {boolean}
     */
    override _isDisabled() {
        return this.props._disabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AbstractAudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 *     _disabled: boolean
 * }}
 */
export function mapStateToProps(state: IReduxState) {
    const _audioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);
    const _disabled = isAudioMuteButtonDisabled(state);
    const enabledFlag = getFeatureFlag(state, AUDIO_MUTE_BUTTON_ENABLED, true);

    return {
        _audioMuted,
        _disabled,
        visible: enabledFlag
    };
}

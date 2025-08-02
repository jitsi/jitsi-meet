// @flow

import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import AbstractSpeakerButton from '../../base/toolbox/components/AbstractSpeakerButton';
import { setSpeakerMuted } from '../actions.web';


/**
 * The type of the React {@code Component} props of {@link VideoMuteButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether video button is disabled or not.
     */
    _speakerMuted: boolean;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments AbstractVideoMuteButton
 */
class SpeakerButton extends AbstractSpeakerButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakermute';
    label = 'toolbar.speakermute';
    tooltip = 'toolbar.speakermute';

    /**
     * Initializes a new {@code VideoMuteButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    // constructor(props: IProps) {
    //     super(props);

    //     // Bind event handlers so they are only bound once per instance.
    //     // this._onKeyboardShortcut = this._onKeyboardShortcut.bind(this);
    // }

    /**
     * Registers the keyboard shortcut that toggles the video muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    // componentDidMount() {

    // }

    /**
     * Unregisters the keyboard shortcut that toggles the video muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    // componentWillUnmount() {

    // }

    /**
     * Indicates if video is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    // _isDisabled() {
    //     return this.props._showParticipantList;
    // }

    /**
     * Indicates if video is currently muted ot nor.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isSpeakerMuted() {
        return this.props._speakerMuted;
    }

    // _onKeyboardShortcut: () => void;

    // /**
    //  * Creates an analytics keyboard shortcut event and dispatches an action to
    //  * toggle the video muting.
    //  *
    //  * @private
    //  * @returns {void}
    //  */
    // _onKeyboardShortcut() {

    // }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} speakerMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setSpeakerMuted(speakerMuted: boolean) {

        this.props.dispatch(setSpeakerMuted(speakerMuted));

        //   console.log(this.props._participants)
        //   this.props._participants.forEach(p => {
        //     APP.UI.speakerMuted(p.id, speakerMuted);
        //   })

        // APP.UI.speakerMuted(id, speakerMuted);
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState): Object {
    const _speakerMuted = state['features/toolbox'].speakerMuted;

    return {
        _speakerMuted
    };
}

export default translate(connect(_mapStateToProps)(SpeakerButton));
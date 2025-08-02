// @flow

import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import AbstractSpeakerButton from '../../base/toolbox/components/AbstractSpeakerButton';
import { setSpeakerMuted } from '../actions.web';

/**
 * The type of the React {@code Component} props of {@link SpeakerButton}.
 */
interface IProps extends AbstractButtonProps {
    /**
     * Whether speaker button is disabled or not.
     */
    _speakerMuted: boolean;
}

/**
 * Component that renders a toolbar button for toggling speaker mute.
 *
 * @augments AbstractSpeakerButton
 */
class SpeakerButton extends AbstractSpeakerButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.speakermute';
    override label = 'Speaker Mute';
    override tooltip = 'Speaker Mute';

    /**
     * Initializes a new {@code SpeakerButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    // constructor(props: IProps) {
    //     super(props);

    //     // Bind event handlers so they are only bound once per instance.
    //     // this.onKeyboardShortcut = this._onKeyboardShortcut.bind(this);
    // }

    /**
     * Registers the keyboard shortcut that toggles the speaker muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    // componentDidMount() {

    // }

    /**
     * Unregisters the keyboard shortcut that toggles the speaker muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    // componentWillUnmount() {

    // }

    /**
     * Indicates if speaker is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    // _isDisabled() {
    //     return this.props._showParticipantList;
    // }

    /**
     * Indicates if speaker is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isSpeakerMuted() {
        return this.props._speakerMuted;
    }

    // _onKeyboardShortcut: () => void;

    // /**
    //  * Creates an analytics keyboard shortcut event and dispatches an action to
    //  * toggle the speaker muting.
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
     * @param {boolean} speakerMuted - Whether speaker should be muted or not.
     * @protected
     * @returns {void}
     */
    override _setSpeakerMuted(speakerMuted: boolean) {
        this.props.dispatch(setSpeakerMuted(speakerMuted));

        //   console.log(this.props.participants)
        //   this.props._participants.forEach(p => {
        //     APP.UI.speakerMuted(p.id, speakerMuted);
        //   })

        // APP.UI.speakerMuted(id, speakerMuted);
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code SpeakerButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _speakerMuted: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState): Object {
    const _speakerMuted = state['features/toolbox'].speakerMuted;

    return {
        _speakerMuted
    };
}

export default translate(connect(_mapStateToProps)(SpeakerButton));
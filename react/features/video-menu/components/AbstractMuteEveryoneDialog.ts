import { IReduxState } from '../../app/types';
import { requestDisableAudioModeration, requestEnableAudioModeration } from '../../av-moderation/actions';
import { isEnabledFromState, isSupported } from '../../av-moderation/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants/functions';
import { muteAllParticipants } from '../actions';

import AbstractMuteRemoteParticipantDialog, {
    type IProps as AbstractProps
} from './AbstractMuteRemoteParticipantDialog';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteEveryoneDialog}.
 */
export interface IProps extends AbstractProps {
    content?: string;
    exclude: Array<string>;
    isAudioModerationEnabled?: boolean;
    isModerationSupported?: boolean;
    showAdvancedModerationToggle: boolean;
    title: string;
}

interface IState {
    audioModerationEnabled?: boolean;
    content: string;
}

/**
 *
 * An abstract Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @augments AbstractMuteRemoteParticipantDialog
 */
export default class AbstractMuteEveryoneDialog<P extends IProps> extends
    AbstractMuteRemoteParticipantDialog<P, IState> {
    static defaultProps = {
        exclude: [],
        muteLocal: false
    };

    /**
     * Initializes a new {@code AbstractMuteRemoteParticipantDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        this.state = {
            audioModerationEnabled: props.isAudioModerationEnabled,
            content: props.content || props.t(props.isAudioModerationEnabled
                ? 'dialog.muteEveryoneDialogModerationOn' : 'dialog.muteEveryoneDialog'
            )
        };

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._onToggleModeration = this._onToggleModeration.bind(this);
    }

    /**
      * Toggles advanced moderation switch.
      *
      * @returns {void}
      */
    _onToggleModeration() {
        this.setState(state => {
            return {
                audioModerationEnabled: !state.audioModerationEnabled,
                content: this.props.t(state.audioModerationEnabled
                    ? 'dialog.muteEveryoneDialog' : 'dialog.muteEveryoneDialogModerationOn'
                )
            };
        });
    }

    /**
     * Callback to be invoked when the value of this dialog is submitted.
     *
     * @returns {boolean}
     */
    _onSubmit() {
        const {
            dispatch,
            exclude
        } = this.props;

        dispatch(muteAllParticipants(exclude, MEDIA_TYPE.AUDIO));
        if (this.state.audioModerationEnabled) {
            dispatch(requestEnableAudioModeration());
        } else if (this.state.audioModerationEnabled !== undefined) {
            dispatch(requestDisableAudioModeration());
        }

        return true;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code AbstractMuteEveryoneDialog}'s props.
 *
 * @param {IReduxState} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component.
 * @returns {IProps}
 */
export function abstractMapStateToProps(state: IReduxState, ownProps: IProps) {
    const { exclude = [], t } = ownProps;

    const whom = exclude
        // eslint-disable-next-line no-confusing-arrow
        .map(id => id === getLocalParticipant(state)?.id
            ? t('dialog.muteEveryoneSelf')
            : getParticipantDisplayName(state, id))
        .join(', ');

    return whom.length ? {
        content: t('dialog.muteEveryoneElseDialog'),
        title: t('dialog.muteEveryoneElseTitle', { whom })
    } : {
        title: t('dialog.muteEveryoneTitle'),
        isAudioModerationEnabled: isEnabledFromState(MEDIA_TYPE.AUDIO, state),
        isModerationSupported: isSupported()(state)
    };
}

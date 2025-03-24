import { IReduxState } from '../../app/types';
import { requestDisableVideoModeration, requestEnableVideoModeration } from '../../av-moderation/actions';
import { isEnabledFromState, isSupported } from '../../av-moderation/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants/functions';
import { muteAllParticipants } from '../actions';

import AbstractMuteRemoteParticipantsVideoDialog, {
    type IProps as AbstractProps
} from './AbstractMuteRemoteParticipantsVideoDialog';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteEveryonesVideoDialog}.
 */
export interface IProps extends AbstractProps {
    content?: string;
    exclude: Array<string>;
    isModerationSupported?: boolean;
    isVideoModerationEnabled?: boolean;
    showAdvancedModerationToggle: boolean;
    title: string;
}

interface IState {
    content: string;
    moderationEnabled?: boolean;
}

/**
 *
 * An abstract Component with the contents for a dialog that asks for confirmation
 * from the user before disabling all remote participants cameras.
 *
 * @augments AbstractMuteRemoteParticipantsVideoDialog
 */
export default class AbstractMuteEveryonesVideoDialog<P extends IProps>
    extends AbstractMuteRemoteParticipantsVideoDialog<P, IState> {
    static defaultProps = {
        exclude: [],
        muteLocal: false
    };

    /**
     * Initializes a new {@code AbstractMuteRemoteParticipantsVideoDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        this.state = {
            moderationEnabled: props.isVideoModerationEnabled,
            content: props.content || props.t(props.isVideoModerationEnabled
                ? 'dialog.muteEveryonesVideoDialogModerationOn' : 'dialog.muteEveryonesVideoDialog'
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
                moderationEnabled: !state.moderationEnabled,
                content: this.props.t(state.moderationEnabled
                    ? 'dialog.muteEveryonesVideoDialog' : 'dialog.muteEveryonesVideoDialogModerationOn'
                )
            };
        });
    }

    /**
     * Callback to be invoked when the value of this dialog is submitted.
     *
     * @returns {boolean}
     */
    override _onSubmit() {
        const {
            dispatch,
            exclude
        } = this.props;

        dispatch(muteAllParticipants(exclude, MEDIA_TYPE.VIDEO));
        if (this.state.moderationEnabled) {
            dispatch(requestEnableVideoModeration());
        } else if (this.state.moderationEnabled !== undefined) {
            dispatch(requestDisableVideoModeration());
        }

        return true;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code AbstractMuteEveryonesVideoDialog}'s props.
 *
 * @param {IReduxState} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component.
 * @returns {IProps}
 */
export function abstractMapStateToProps(state: IReduxState, ownProps: IProps) {
    const { exclude = [], t } = ownProps;
    const isVideoModerationEnabled = isEnabledFromState(MEDIA_TYPE.VIDEO, state);

    const whom = exclude
        // eslint-disable-next-line no-confusing-arrow
        .map(id => id === getLocalParticipant(state)?.id
            ? t('dialog.muteEveryoneSelf')
            : getParticipantDisplayName(state, id))
        .join(', ');

    return whom.length ? {
        content: t('dialog.muteEveryoneElsesVideoDialog'),
        title: t('dialog.muteEveryoneElsesVideoTitle', { whom })
    } : {
        title: t('dialog.muteEveryonesVideoTitle'),
        isVideoModerationEnabled,
        isModerationSupported: isSupported()(state)
    };
}

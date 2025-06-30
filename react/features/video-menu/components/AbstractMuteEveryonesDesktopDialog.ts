import { IReduxState } from '../../app/types';
import { requestDisableDesktopModeration, requestEnableDesktopModeration } from '../../av-moderation/actions';
import { MEDIA_TYPE as AVM_MEDIA_TYPE } from '../../av-moderation/constants';
import { isEnabledFromState, isSupported } from '../../av-moderation/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants/functions';
import { muteAllParticipants } from '../actions';

import AbstractMuteRemoteParticipantsDesktopDialog, {
    type IProps as AbstractProps
} from './AbstractMuteRemoteParticipantsDesktopDialog';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteEveryonesDesktopDialog}.
 */
export interface IProps extends AbstractProps {
    content?: string;
    exclude: Array<string>;
    isModerationEnabled?: boolean;
    isModerationSupported?: boolean;
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
 * @augments AbstractMuteRemoteParticipantsDesktopDialog
 */
export default class AbstractMuteEveryonesDesktopDialog<P extends IProps>
    extends AbstractMuteRemoteParticipantsDesktopDialog<P, IState> {
    static defaultProps = {
        exclude: [],
        muteLocal: false
    };

    /**
     * Initializes a new {@code AbstractMuteRemoteParticipantsDesktopDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        this.state = {
            moderationEnabled: props.isModerationEnabled,
            content: props.content || props.t(props.isModerationEnabled
                ? 'dialog.muteEveryonesDesktopDialogModerationOn' : 'dialog.muteEveryonesDesktopDialog'
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
                    ? 'dialog.muteEveryonesDesktopDialog' : 'dialog.muteEveryonesDesktopDialogModerationOn'
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

        dispatch(muteAllParticipants(exclude, MEDIA_TYPE.SCREENSHARE));
        if (this.state.moderationEnabled) {
            dispatch(requestEnableDesktopModeration());
        } else if (this.state.moderationEnabled !== undefined) {
            dispatch(requestDisableDesktopModeration());
        }

        return true;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code AbstractMuteEveryonesDesktopDialog}'s props.
 *
 * @param {IReduxState} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component.
 * @returns {IProps}
 */
export function abstractMapStateToProps(state: IReduxState, ownProps: IProps) {
    const { exclude = [], t } = ownProps;
    const isModerationEnabled = isEnabledFromState(AVM_MEDIA_TYPE.DESKTOP, state);

    const whom = exclude
        // eslint-disable-next-line no-confusing-arrow
        .map(id => id === getLocalParticipant(state)?.id
            ? t('dialog.muteEveryoneSelf')
            : getParticipantDisplayName(state, id))
        .join(', ');

    return whom.length ? {
        content: t('dialog.muteEveryoneElsesDesktopDialog'),
        title: t('dialog.muteEveryoneElsesDesktopTitle', { whom })
    } : {
        title: t('dialog.muteEveryonesDesktopTitle'),
        isModerationEnabled,
        isModerationSupported: isSupported()(state)
    };
}

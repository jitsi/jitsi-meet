// @flow

import React from 'react';

import { requestDisableAudioModeration, requestEnableAudioModeration } from '../../av-moderation/actions';
import { isEnabledFromState, isSupported } from '../../av-moderation/functions';
import { Dialog } from '../../base/dialog';
import { MEDIA_TYPE } from '../../base/media';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants';
import { muteAllParticipants } from '../actions';

import AbstractMuteRemoteParticipantDialog, {
    type Props as AbstractProps
} from './AbstractMuteRemoteParticipantDialog';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteEveryoneDialog}.
 */
export type Props = AbstractProps & {

    content: string,
    exclude: Array<string>,
    title: string,
    showAdvancedModerationToggle: boolean,
    isAudioModerationEnabled: boolean,
    isModerationSupported: boolean
};

type State = {
    audioModerationEnabled: boolean,
    content: string
};

/**
 *
 * An abstract Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @augments AbstractMuteRemoteParticipantDialog
 */
export default class AbstractMuteEveryoneDialog<P: Props> extends AbstractMuteRemoteParticipantDialog<P, State> {
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
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { content, title } = this.props;

        return (
            <Dialog
                okKey = 'dialog.muteParticipantButton'
                onSubmit = { this._onSubmit }
                titleString = { title }
                width = 'small'>
                <div>
                    { content }
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;

    _onToggleModeration: () => void;

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
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component.
 * @returns {Props}
 */
export function abstractMapStateToProps(state: Object, ownProps: Props) {
    const { exclude = [], t } = ownProps;

    const whom = exclude
        // eslint-disable-next-line no-confusing-arrow
        .map(id => id === getLocalParticipant(state).id
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

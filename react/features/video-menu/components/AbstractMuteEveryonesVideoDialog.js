// @flow

import React from 'react';

import { requestDisableVideoModeration, requestEnableVideoModeration } from '../../av-moderation/actions';
import { isEnabledFromState, isSupported } from '../../av-moderation/functions';
import { Dialog } from '../../base/dialog';
import { MEDIA_TYPE } from '../../base/media';
import { getLocalParticipant, getParticipantDisplayName } from '../../base/participants';
import { muteAllParticipants } from '../actions';

import AbstractMuteRemoteParticipantsVideoDialog, {
    type Props as AbstractProps
} from './AbstractMuteRemoteParticipantsVideoDialog';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteEveryonesVideoDialog}.
 */
export type Props = AbstractProps & {

    content: string,
    exclude: Array<string>,
    title: string,
    showAdvancedModerationToggle: boolean,
    isVideoModerationEnabled: boolean,
    isModerationSupported: boolean
};

type State = {
    moderationEnabled: boolean;
    content: string;
};

/**
 *
 * An abstract Component with the contents for a dialog that asks for confirmation
 * from the user before disabling all remote participants cameras.
 *
 * @augments AbstractMuteRemoteParticipantsVideoDialog
 */
export default class AbstractMuteEveryonesVideoDialog<P: Props>
    extends AbstractMuteRemoteParticipantsVideoDialog<P, State> {
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
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { content, title } = this.props;

        return (
            <Dialog
                okKey = 'dialog.muteParticipantsVideoButton'
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
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component.
 * @returns {Props}
 */
export function abstractMapStateToProps(state: Object, ownProps: Props) {
    const { exclude = [], t } = ownProps;
    const isVideoModerationEnabled = isEnabledFromState(MEDIA_TYPE.VIDEO, state);

    const whom = exclude
        // eslint-disable-next-line no-confusing-arrow
        .map(id => id === getLocalParticipant(state).id
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

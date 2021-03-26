// @flow

import React from 'react';

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
    title: string
};

/**
 *
 * An abstract Component with the contents for a dialog that asks for confirmation
 * from the user before muting all remote participants.
 *
 * @extends AbstractMuteRemoteParticipantDialog
 */
export default class AbstractMuteEveryoneDialog<P: Props> extends AbstractMuteRemoteParticipantDialog<P> {
    static defaultProps = {
        exclude: [],
        muteLocal: false
    };

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
        content: t('dialog.muteEveryoneDialog'),
        title: t('dialog.muteEveryoneTitle')
    };
}

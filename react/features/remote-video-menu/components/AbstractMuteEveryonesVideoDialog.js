// @flow

import React from 'react';

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
    title: string
};

/**
 *
 * An abstract Component with the contents for a dialog that asks for confirmation
 * from the user before disabling all remote participants cameras.
 *
 * @extends AbstractMuteRemoteParticipantsVideoDialog
 */
export default class AbstractMuteEveryonesVideoDialog<P: Props> extends AbstractMuteRemoteParticipantsVideoDialog<P> {
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
    const { exclude, t } = ownProps;

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
        content: t('dialog.muteEveryonesVideoDialog'),
        title: t('dialog.muteEveryonesVideoTitle')
    };
}

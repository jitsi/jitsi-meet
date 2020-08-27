// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { muteAllParticipants } from '../../actions';
import AbstractMuteRemoteParticipantDialog, {
    type Props as AbstractProps
} from '../AbstractMuteRemoteParticipantDialog';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of
 * {@link MuteEveryoneDialog}.
 */
type Props = AbstractProps & {

    /**
     * The IDs of the remote participants to exclude from being muted.
     */
    exclude: Array<string>
};

/**
 * Translations needed for dialog rendering.
 */
type Translations = {

    /**
     * Content text.
     */
    content: string,

    /**
     * Title text.
     */
    title: string
}

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting a remote participant.
 *
 * @extends Component
 */
class MuteEveryoneDialog extends AbstractMuteRemoteParticipantDialog<Props> {
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
        const { content, title } = this._getTranslations();

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

        dispatch(muteAllParticipants(exclude));

        return true;
    }

    /**
     * Method to get translations depending on whether we have an exclusive
     * mute or not.
     *
     * @returns {Translations}
     * @private
     */
    _getTranslations(): Translations {
        const { exclude, t } = this.props;
        const { conference } = APP;
        const whom = exclude
            // eslint-disable-next-line no-confusing-arrow
            .map(id => conference.isLocalId(id)
                ? t('dialog.muteEveryoneSelf')
                : conference.getParticipantDisplayName(id))
            .join(', ');

        return whom.length ? {
            content: t('dialog.muteEveryoneElseDialog'),
            title: t('dialog.muteEveryoneElseTitle', { whom })
        } : {
            content: t('dialog.muteEveryoneDialog'),
            title: t('dialog.muteEveryoneTitle')
        };
    }
}

export default translate(connect()(MuteEveryoneDialog));

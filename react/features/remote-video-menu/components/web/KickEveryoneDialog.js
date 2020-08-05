// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { kickAllParticipants } from '../../actions';
import AbstractKickRemoteParticipantDialog, {
    type Props as AbstractProps
} from '../AbstractKickRemoteParticipantDialog';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of
 * {@link KickEveryoneDialog}.
 */
type Props = AbstractProps & {

    /**
     * The IDs of the remote participants to exclude from being kicked.
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
class KickEveryoneDialog extends AbstractKickRemoteParticipantDialog<Props> {
    static defaultProps = {
        exclude: [],
        kickLocal: false
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
                okKey = 'dialog.kickParticipantButton'
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

        dispatch(kickAllParticipants(exclude));

        return true;
    }

    /**
     * Method to get translations depending on whether we have an exclusive
     * kick or not.
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
                ? t('dialog.kickEveryoneSelf')
                : conference.getParticipantDisplayName(id))
            .join(', ');

        return whom.length ? {
            content: t('dialog.kickEveryoneElseDialog'),
            title: t('dialog.kickEveryoneElseTitle', { whom })
        } : {
            content: t('dialog.kickEveryoneDialog'),
            title: t('dialog.kickEveryoneTitle')
        };
    }
}

export default translate(connect()(KickEveryoneDialog));

// @flow

import { openDialog } from '../../base/dialog';
import { IconTip } from '../../base/icons';
import { AbstractButton } from '../../base/toolbox';
import { getParticipantById } from '../../base/participants';
import type { AbstractButtonProps } from '../../base/toolbox';
import { createDeepLinkUrl } from '../../base/util/createDeepLinkUrl';

import TipRemoteParticipantDialog from './web/TipRemoteParticipantDialog';

declare var APP: Object;

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant that this button is supposed to tip.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which tips the remote participant.
 */
export default class AbstractTipButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.tip';
    icon = IconTip;
    label = 'videothumbnail.tip';

    constructor(props) {
        super(props);
        this._onTipDeepLink = this._onTipDeepLink.bind(this);
    }

    /**
     * Create tip deeplink URL object.
     *
     * @returns {Object}
     */
    _deepLinkTip(akAddress) {
        const url = createDeepLinkUrl({ type: 'tip' });

        url.searchParams.set('url', `https://superhero.com/user-profile/${akAddress}`);

        return url;
    }

    /**
     * On tip deeplink popup.
     *
     * @returns {void}
     */
    _onTipDeepLink() {
        const { participantID } = this.props;
        const state = APP.store.getState();
        const akAddress = getParticipantById(state, participantID).akAddress;

        window.open(this._deepLinkTip(akAddress).toString(), 'popup', 'width=374, height=600, top=20, left=20');
    }

    /**
     * Handles clicking / pressing the button, and opens the tipping dialog for a participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        debugger;
        if (this.props.hasWallet) {
            const { dispatch, participantID } = this.props;

            dispatch(openDialog(TipRemoteParticipantDialog, { participantID }));
        } else {
            this._onTipDeepLink();
        }

    }
}

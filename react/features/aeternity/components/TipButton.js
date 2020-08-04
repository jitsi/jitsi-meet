// @flow
/* eslint-disable comma-dangle, max-len */

import React, { Component } from 'react';

import { openDialog } from '../../base/dialog';
import TipIcon from '../../base/icons/svg/tip.svg';
import { connect } from '../../base/redux';
import { createDeepLinkUrl } from '../../base/util/createDeepLinkUrl';
import TipRemoteParticipantDialog from '../../remote-video-menu/components/web/TipRemoteParticipantDialog';

type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Account or chain name
     */
    account: string,


    /**
     * Whether user has wallet
     */
    hasWallet: boolean
};


/**
 * Aeternity tip button react version.
 */
class TipButton extends Component<Props, State> {
    /**
     * Initializes a new TipButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onToggleTooltip = this._onToggleTooltip.bind(this);
        this._onTipDeepLink = this._onTipDeepLink.bind(this);
    }

    /**
     * Toggle tooltip.
     *
     * @param {string} currency - New currency.
     * @returns {void}
     */
    _onToggleTooltip() {
        // send action to open dialog
        this.props.dispatch(openDialog(TipRemoteParticipantDialog, { account: this.props.account }));
    }

    /**
     * Create tip deeplink URL object.
     *
     * @returns {Object}
     */
    _deepLinkTip() {
        const url = createDeepLinkUrl({ type: 'tip' });

        url.searchParams.set('url', `https://superhero.com/user-profile/${this.props.account}`);

        return url;
    }

    /**
     * On tip deeplink popup.
     *
     * @returns {void}
     */
    _onTipDeepLink() {
        window.open(this._deepLinkTip().toString(), 'popup', 'width=374, height=600, top=20, left=20');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const onClick = this.props.hasWallet ? this._onToggleTooltip : this._onTipDeepLink;
        return (
            <div className = 'tip-icon' >
                <TipIcon onClick = { onClick } />
            </div>

        );
    }
}
export default connect()(TipButton);

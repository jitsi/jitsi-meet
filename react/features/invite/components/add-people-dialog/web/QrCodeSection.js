// @flow

import QRCode from 'qrcode.react';
import React, { useState } from 'react';

import { translate } from '../../../../base/i18n';
import {
    Icon,
    IconArrowDownSmall
} from '../../../../base/icons';
import { copyText } from '../../../../base/util';


type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The URL of the conference.
     */
    url: string
};

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function QrCodeSection({ t, url }: Props) {
    const [ isActive, setIsActive ] = useState(false);

    /**
     * Toggles the email invite drawer.
     *
     * @returns {void}
     */
    function _onToggleActiveState() {
        setIsActive(!isActive);
    }

    /**
     * Copies the conference invitation to the clipboard.
     *
     * @returns {void}
     */
    function _onCopyText() {
        copyText(url);
    }

    return (
        <>
            <div>
                <div
                    className = { `invite-more-dialog qr-container${isActive ? ' active' : ''}` }
                    onClick = { _onToggleActiveState }>
                    <span>{t('addPeople.shareQrCode')}</span>
                    <Icon src = { IconArrowDownSmall } />
                </div>
                <div className = { `invite-more-dialog qr-code-container${isActive ? ' active' : ''}` }>
                    <QRCode
                        includeMargin = { false }
                        onClick = { _onCopyText }
                        size = { 200 }
                        value = { url } />
                </div>
            </div>
        </>
    );
}

export default translate(QrCodeSection);

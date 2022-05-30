// @flow

import React from 'react';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconBookmark, IconDollar, IconCart } from '../../base/icons';
import './styles.css'

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
 * Allow users to embed a jitsi meeting in an iframe.
 *
 * @returns {React$Element<any>}
 */
function NewModal6({ t, url }: Props) {

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { true }
            width = 'small'>
                <div style={{paddingTop:'10px'}} className = 'embed-meeting-dialog-tok'>
                    <div>Tok Byte Saved</div>
                </div>
        </Dialog>
    );
}



export default translate(NewModal6);

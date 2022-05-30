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
function NewModal7({ t, url }: Props) {

    return (
        <Dialog
            hideCancelButton = { false }
            submitDisabled = { true }
            width = 'small'>
            <div className = 'embed-meeting-dialog'>
            <p>I agree if i am selected for a golden ticket. I'll behave appropriately as defined in the terms of service.</p>
            </div>
        </Dialog>
    );
}



export default translate(NewModal7);

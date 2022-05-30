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
function NewModal1({ t, url }: Props) {

    return (
        <Dialog className='dialog1'
            hideCancelButton={false}
            submitDisabled={true}
            width='small'>
            <div className='embed-meeting-dialog'>
                <button className='icons'><Icon className='icon' src={IconCart} />Add to Cart</button>
                <button className='icons'><Icon className='icon' src={IconDollar} />Buy This Now</button>
                <button className='icons'><Icon className='icon' src={IconBookmark} />save as TokShop</button>
            </div>
        </Dialog>
    );
}



export default translate(NewModal1);

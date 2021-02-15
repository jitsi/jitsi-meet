// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React, { useState } from 'react';

import { Dialog } from '../../../base/dialog';

// import { getYoutubeLink } from '../../functions';


/**
 * Example shared video link.
 * @type {string}
 */
const defaultSharedVideoLink = 'https://youtu.be/TB7LlM4erx8';

/**
 * Component that renders the video share dialog.
 *
 * @returns {React$Element<any>}
 */
function SharedVideoDialog() {
    const [ sharedVideoLink, setSharedVideoLink ] = useState('');

    /**
     * Method updated shared link input with what the user adds.
     *
     * @param {Event} event - Key down event object.
     *
     * @private
     * @returns {void}
     */
    function onChangeVideoLink(event) {
        const link = event.target.value;

        setSharedVideoLink(link);
    }

    return (
        <Dialog
            hideCancelButton = { false }
            okKey = 'dialog.Share'
            submitDisabled = { false }
            titleKey = 'dialog.shareVideoTitle'
            width = { 'small' }>
            <FieldTextStateless
                autoFocus = { true }
                compact = { false }
                onChange = { onChangeVideoLink }
                placeholder = { defaultSharedVideoLink }
                shouldFitContainer = { true }
                type = 'text'
                value = { sharedVideoLink } />
        </Dialog>
    );
}

export default SharedVideoDialog;

// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { defaultMobileSharedVideoLink } from '../../constants';
import { getYoutubeId } from '../../functions';
import AbstractSharedVideoDialog from '../AbstractSharedVideoDialog';

/**
 * Implements a component to render a display name prompt.
 */
class SharedVideoDialog extends AbstractSharedVideoDialog<*> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                contentKey = 'dialog.shareVideoTitle'
                onSubmit = { this._onSetVideoLink }
                textInputProps = {{
                    placeholder: defaultMobileSharedVideoLink
                }} />
        );
    }

    /**
     * Validates the entered video link by extracting the id and dispatches it.
     *
     * It returns a boolean to comply the Dialog behaviour:
     *     {@code true} - the dialog should be closed.
     *     {@code false} - the dialog should be left open.
     *
     * @param {string} link - The entered video link.
     * @returns {boolean}
     */
    _onSetVideoLink(link: string) {
        if (!link || !link.trim()) {
            return false;
        }

        const videoId = getYoutubeId(link);

        if (videoId) {
            const { onPostSubmit } = this.props;

            onPostSubmit && onPostSubmit(videoId);

            return true;
        }

        return false;
    }
}

export default connect()(SharedVideoDialog);

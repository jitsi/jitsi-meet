// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractEnterVideoLinkPrompt}.
 */
export type Props = {

    /**
     * Invoked to update the shared youtube video link.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after typing a valid youtube video .
     */
    onPostSubmit: ?Function
};

/**
 * Implements an abstract class for {@code EnterVideoLinkPrompt}.
 */
export default class AbstractEnterVideoLinkPrompt<S: *> extends Component < Props, S > {
    /**
     * Instantiates a new component.
     *
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSetVideoLink = this._onSetVideoLink.bind(this);
    }

    _onSetVideoLink: string => boolean;

    /**
     * Validates the entered video link by extractibg the id and dispatches it.
     *
     * It returns a boolean to comply the Dialog behaviour:
     *     {@code true} - the dialog should be closed.
     *     {@code false} - the dialog should be left open.
     *
     * @param {string} link - The entered video link.
     * @returns {boolean}
     */
    _onSetVideoLink(link) {
        if (!link || !link.trim()) {
            return false;
        }

        const videoId = getYoutubeLink(link);

        if (videoId) {
            const { onPostSubmit } = this.props;

            onPostSubmit && onPostSubmit(videoId);

            return true;
        }

        return false;
    }
}

/**
 * Validates the entered video url.
 *
 * It returns a boolean to reflect whether the url matches the youtube regex.
 *
 * @param {string} url - The entered video link.
 * @returns {boolean}
 */
function getYoutubeLink(url) {
    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|(?:m\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;// eslint-disable-line max-len
    const result = url.match(p);

    return result ? result[1] : false;
}

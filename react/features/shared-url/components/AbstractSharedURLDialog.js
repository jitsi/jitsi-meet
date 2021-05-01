// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';
import { getSharedURL } from '../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractSharedURLDialog}.
 */
export type Props = {

    /**
     * Invoked to update the shared website link.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after typing a valid URL.
     */
    onPostSubmit: ?Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements an abstract class for {@code SharedURLDialog}.
 */
export default class AbstractSharedURLDialog<S: *> extends Component < Props, S > {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSetURL = this._onSetURL.bind(this);
    }

    _onSetURL: string => boolean;

    /**
     * Validates the entered URL by extracting the id and dispatches it.
     *
     * It returns a boolean to comply the Dialog behaviour:
     *     {@code true} - the dialog should be closed.
     *     {@code false} - the dialog should be left open.
     *
     * @param {string} link - The entered video link.
     * @returns {boolean}
     */
    _onSetURL(link: string) {
        if (!link || !link.trim()) {
            return false;
        }

        const sharedURL = getSharedURL(link);

        if (sharedURL) {
            const { onPostSubmit } = this.props;

            onPostSubmit && onPostSubmit(sharedURL);

            return true;
        }

        return false;
    }
}



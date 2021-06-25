// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractSharedVideoDialog}.
 */
export type Props = {

    /**
     * Invoked to update the shared video link.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after typing a valid video.
     */
    onPostSubmit: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements an abstract class for {@code SharedVideoDialog}.
 */
export default class AbstractSharedVideoDialog<S: *> extends Component < Props, S > {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSetVideoLink = this._onSetVideoLink.bind(this);
    }

    _onSetVideoLink: string => boolean;
}

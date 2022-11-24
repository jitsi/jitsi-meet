import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IStore } from '../../app/types';
import { extractYoutubeIdOrURL } from '../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractSharedVideoDialog}.
 */
export interface IProps extends WithTranslation {

    /**
     * Invoked to update the shared video link.
     */
    dispatch: IStore['dispatch'];

    /**
     * Function to be invoked after typing a valid video.
     */
    onPostSubmit: Function;
}

/**
 * Implements an abstract class for {@code SharedVideoDialog}.
 */
export default class AbstractSharedVideoDialog<S> extends Component < IProps, S > {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onSetVideoLink = this._onSetVideoLink.bind(this);
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
        const { onPostSubmit } = this.props;

        const id = extractYoutubeIdOrURL(link);

        if (!id) {
            return false;
        }

        onPostSubmit(id);

        return true;
    }
}

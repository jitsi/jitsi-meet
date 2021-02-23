// @flow

import { Component } from 'react';
import type { Dispatch } from 'redux';

import { getYoutubeLink } from '../';
import { getFieldValue } from '../../base/react';


/**
 * The type of the React {@code Component} props of
 * {@link AbstractSharedVideoDialog}.
 */
export type Props = {

    /**
     * Invoked to update the shared youtube video link.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be invoked after typing a valid youtube video .
     */
    onPostSubmit: ?Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Value in input.
     */
    value: string
};

/**
 * The state of the component.
 */
type State = {

    /**
     * Value from input.
     */
    inputValue: string,

    /**
     * Check if ok button is disabled
     */
    okDisabled: boolean
};

/**
 * Implements an abstract class for {@code SharedVideoDialog}.
 */
export default class AbstractSharedVideoDialog<P: Props> extends Component <P, State> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            inputValue: this.props.value || '',
            okDisabled: true
        };

        this._onChange = this._onChange.bind(this);
        this._onSetVideoLink = this._onSetVideoLink.bind(this);
    }


    _onChange: Object => void;

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    _onChange(evt) {
        const linkValue = getFieldValue(evt);

        this.setState({
            inputValue: linkValue,
            okDisabled: !getYoutubeLink(linkValue)
        });
    }

    _onSetVideoLink: string => boolean;

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
    _onSetVideoLink() {
        const { inputValue } = this.state,
            videoId = getYoutubeLink(inputValue);

        if (videoId) {
            const { onPostSubmit } = this.props;

            onPostSubmit && onPostSubmit(videoId);

            return true;
        }

        return false;
    }
}



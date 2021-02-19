// @flow

import { Component } from 'react';

import { getFieldValue } from '../../base/react';
import { getYoutubeLink } from '../functions';


/**
 * The type of the React {@code Component} props of
 * {@link AbstractSharedVideoDialog}.
 */
export type Props = {

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
    okDisabled: boolean,

    /**
     * Check if shared video is shown
     */
    sharedVideoShown: boolean
};

/**
 * Implements an abstract class for {@code SharedVideoDialog}.
 */
export default class AbstractSharedVideoDialog<P: Props> extends Component <P, State> {
    /**
     * Instantiates a new component.
     *
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
        this._onSubmit = this._onSubmit.bind(this);
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

    _onSubmit: string => boolean;

    /**
     * Validates the entered video link by extracting the id and dispatches it to youtube iframe.
     *
     * @returns {boolean}
     */
    _onSubmit() {
        const { inputValue } = this.state;

        if (!inputValue || !inputValue.trim()) {
            return false;
        }

        const videoId = getYoutubeLink(inputValue);

        if (videoId) {
            const { onPostSubmit } = this.props;

            onPostSubmit && onPostSubmit(videoId);

            return true;
        }

        return false;
    }
}



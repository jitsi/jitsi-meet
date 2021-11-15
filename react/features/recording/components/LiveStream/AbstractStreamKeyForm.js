// @flow

import debounce from 'lodash/debounce';
import { Component } from 'react';

declare var interfaceConfig: Object;

/**
 * The live streaming help link to display. On web it comes from
 * interfaceConfig, but we don't have that on mobile.
 *
 * FIXME: This is in props now to prepare for the Redux-based interfaceConfig.
 */
const LIVE_STREAMING_HELP_LINK = 'https://jitsi.org/live';

/**
 * The props of the component.
 */
export type Props = {

    /**
     * Callback invoked when the entered stream key has changed.
     */
    onChange: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The stream key value to display as having been entered so far.
     */
    value: string
};

/**
 * The state of the component.
 */
type State = {

    /**
     * Whether or not to show the warnings that the passed in value seems like
     * an improperly formatted stream key.
     */
    showValidationError: boolean
};

/**
 * An abstract React Component for entering a key for starting a YouTube live
 * stream.
 *
 * @augments Component
 */
export default class AbstractStreamKeyForm<P: Props>
    extends Component<P, State> {
    helpURL: string;
    _debouncedUpdateValidationErrorVisibility: Function;

    /**
     * Constructor for the component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            showValidationError: Boolean(this.props.value)
                && !this._validateStreamKey(this.props.value)
        };

        this.helpURL = (typeof interfaceConfig !== 'undefined'
            && interfaceConfig.LIVE_STREAMING_HELP_LINK)
            || LIVE_STREAMING_HELP_LINK;

        this._debouncedUpdateValidationErrorVisibility = debounce(
            this._updateValidationErrorVisibility.bind(this),
            800,
            { leading: false }
        );

        // Bind event handlers so they are only bound once per instance.
        this._onInputChange = this._onInputChange.bind(this);
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: P) {
        if (this.props.value !== prevProps.value) {
            this._debouncedUpdateValidationErrorVisibility();
        }
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._debouncedUpdateValidationErrorVisibility.cancel();
    }

    _onInputChange: Object => void;

    /**
     * Callback invoked when the value of the input field has updated through
     * user input. This forwards the value (string only, even if it was a dom
     * event) to the onChange prop provided to the component.
     *
     * @param {Object | string} change - DOM Event for value change or the
     * changed text.
     * @private
     * @returns {void}
     */
    _onInputChange(change) {
        const value = typeof change === 'object' ? change.target.value : change;

        this.props.onChange(value);
    }

    /**
     * Checks if the stream key value seems like a valid stream key and sets the
     * state for showing or hiding the notification about the stream key seeming
     * invalid.
     *
     * @private
     * @returns {boolean}
     */
    _updateValidationErrorVisibility() {
        const newShowValidationError = Boolean(this.props.value)
            && !this._validateStreamKey(this.props.value);

        if (newShowValidationError !== this.state.showValidationError) {
            this.setState({
                showValidationError: newShowValidationError
            });
        }
    }

    /**
     * Checks if a passed in stream key appears to be in a valid format.
     *
     * @param {string} streamKey - The stream key to check for valid formatting.
     * @returns {void}
     * @returns {boolean}
     */
    _validateStreamKey(streamKey = '') {
        const trimmedKey = streamKey.trim();
        const fourGroupsDashSeparated = /^(?:[a-zA-Z0-9]{4}(?:-(?!$)|$)){4}/;
        const match = fourGroupsDashSeparated.exec(trimmedKey);

        return Boolean(match);
    }
}

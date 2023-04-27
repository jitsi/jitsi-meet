import { DebouncedFunc } from 'lodash';
import debounce from 'lodash/debounce';
import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../../app/types';

import { getLiveStreaming } from './functions';


export type LiveStreaming = {

    // Terms link
    dataPrivacyLink: string;
    enabled: boolean;
    helpLink: string;

    // Documentation reference for the live streaming feature.
    termsLink: string; // Data privacy link
    validatorRegExpString: string; // RegExp string that validates the stream key input field
};

export type LiveStreamingProps = {
    dataPrivacyURL: string;
    enabled: boolean;
    helpURL: string;
    streamLinkRegexp: RegExp;
    termsURL: string;
};

/**
 * The props of the component.
 */
export interface IProps extends WithTranslation {

    /**
     * The live streaming dialog properties.
     */
    _liveStreaming: LiveStreamingProps;

    classes?: any;

    /**
     * Callback invoked when the entered stream key has changed.
     */
    onChange: Function;

    /**
     * The stream key value to display as having been entered so far.
     */
    value: string;
}

/**
 * The state of the component.
 */
interface IState {

    /**
     * Whether or not to show the warnings that the passed in value seems like
     * an improperly formatted stream key.
     */
    showValidationError: boolean;
}

/**
 * An abstract React Component for entering a key for starting a YouTube live
 * stream.
 *
 * @augments Component
 */
export default class AbstractStreamKeyForm<P extends IProps>
    extends Component<P, IState> {

    _debouncedUpdateValidationErrorVisibility: DebouncedFunc<() => void>;

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
    _onInputChange(change: any) {
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
        const match = this.props._liveStreaming.streamLinkRegexp.exec(trimmedKey);

        return Boolean(match);
    }
}

/**
 * Maps part of the Redux state to the component's props.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _liveStreaming: LiveStreamingProps
 * }}
 */
export function _mapStateToProps(state: IReduxState) {
    return {
        _liveStreaming: getLiveStreaming(state)
    };
}

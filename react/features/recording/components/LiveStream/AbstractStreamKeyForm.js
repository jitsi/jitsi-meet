// @flow

import { Component } from 'react';

declare var interfaceConfig: Object;

/**
 * The live streaming help link to display. On web it comes from
 * interfaceConfig, but we don't have that on mobile.
 *
 * FIXME: This is in props now to prepare for the Redux-based interfaceConfig
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
     * The value entered in the field.
     */
    value: string
}

/**
 * An abstract React Component for entering a key for starting a YouTube live
 * stream.
 *
 * @extends Component
 */
export default class AbstractStreamKeyForm extends Component<Props, State> {
    helpURL: string;

    /**
     * Constructor for the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            value: props.value
        };

        this.helpURL = (typeof interfaceConfig !== 'undefined'
            && interfaceConfig.LIVE_STREAMING_HELP_LINK)
            || LIVE_STREAMING_HELP_LINK;

        // Bind event handlers so they are only bound once per instance.
        this._onInputChange = this._onInputChange.bind(this);
    }

    /**
     * Implements {@code Component}'s componentWillReceiveProps.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(newProps: Props) {
        this.setState({
            value: newProps.value
        });
    }

    _onInputChange: Object => void

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

        this.setState({
            value
        });
        this.props.onChange(value);
    }
}

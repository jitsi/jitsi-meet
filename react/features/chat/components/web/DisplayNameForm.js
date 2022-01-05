// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { updateSettings } from '../../../base/settings';

import KeyboardAvoider from './KeyboardAvoider';

/**
 * The type of the React {@code Component} props of {@DisplayNameForm}.
 */
type Props = {

    /**
     * Invoked to set the local participant display name.
     */
    dispatch: Dispatch<any>,

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@DisplayNameForm}.
 */
type State = {

    /**
     * User provided display name when the input text is provided in the view.
     */
    displayName: string
};

/**
 * React Component for requesting the local participant to set a display name.
 *
 * @augments Component
 */
class DisplayNameForm extends Component<Props, State> {
    state = {
        displayName: ''
    };

    /**
     * Initializes a new {@code DisplayNameForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isPollsEnabled, t } = this.props;

        return (
            <div id = 'nickname'>
                <form onSubmit = { this._onSubmit }>
                    <FieldTextStateless
                        aria-describedby = 'nickname-title'
                        autoComplete = 'name'
                        autoFocus = { true }
                        compact = { true }
                        id = 'nickinput'
                        label = { t(isPollsEnabled ? 'chat.nickname.titleWithPolls' : 'chat.nickname.title') }
                        onChange = { this._onDisplayNameChange }
                        placeholder = { t('chat.nickname.popover') }
                        shouldFitContainer = { true }
                        type = 'text'
                        value = { this.state.displayName } />
                </form>
                <div
                    className = { `enter-chat${this.state.displayName.trim() ? '' : ' disabled'}` }
                    onClick = { this._onSubmit }
                    onKeyPress = { this._onKeyPress }
                    role = 'button'
                    tabIndex = { 0 }>
                    { t('chat.enter') }
                </div>
                <KeyboardAvoider />
            </div>
        );
    }

    _onDisplayNameChange: (Object) => void;

    /**
     * Dispatches an action update the entered display name.
     *
     * @param {event} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange(event: Object) {
        this.setState({ displayName: event.target.value });
    }

    _onSubmit: (Object) => void;

    /**
     * Dispatches an action to hit enter to change your display name.
     *
     * @param {event} event - Keyboard event
     * that will check if user has pushed the enter key.
     * @private
     * @returns {void}
     */
    _onSubmit(event: Object) {
        event.preventDefault();

        // Store display name in settings
        this.props.dispatch(updateSettings({
            displayName: this.state.displayName
        }));
    }

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            this._onSubmit(e);
        }
    }
}

export default translate(connect()(DisplayNameForm));

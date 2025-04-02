import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { updateSettings } from '../../../base/settings/actions';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';

import KeyboardAvoider from './KeyboardAvoider';

/**
 * The type of the React {@code Component} props of {@DisplayNameForm}.
 */
interface IProps extends WithTranslation {

    /**
     * Invoked to set the local participant display name.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean;
}

/**
 * The type of the React {@code Component} state of {@DisplayNameForm}.
 */
interface IState {

    /**
     * User provided display name when the input text is provided in the view.
     */
    displayName: string;
}

/**
 * React Component for requesting the local participant to set a display name.
 *
 * @augments Component
 */
class DisplayNameForm extends Component<IProps, IState> {
    override state = {
        displayName: ''
    };

    /**
     * Initializes a new {@code DisplayNameForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
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
    override render() {
        const { isPollsEnabled, t } = this.props;

        return (
            <div id = 'nickname'>
                <form onSubmit = { this._onSubmit }>
                    <Input
                        accessibilityLabel = { t('chat.nickname.title') }
                        autoFocus = { true }
                        id = 'nickinput'
                        label = { t(isPollsEnabled ? 'chat.nickname.titleWithPolls' : 'chat.nickname.title') }
                        name = 'name'
                        onChange = { this._onDisplayNameChange }
                        placeholder = { t('chat.nickname.popover') }
                        type = 'text'
                        value = { this.state.displayName } />
                </form>
                <br />
                <Button
                    accessibilityLabel = { t('chat.enter') }
                    disabled = { !this.state.displayName.trim() }
                    fullWidth = { true }
                    label = { t('chat.enter') }
                    onClick = { this._onSubmit } />
                <KeyboardAvoider />
            </div>
        );
    }

    /**
     * Dispatches an action update the entered display name.
     *
     * @param {string} value - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange(value: string) {
        this.setState({ displayName: value });
    }

    /**
     * Dispatches an action to hit enter to change your display name.
     *
     * @param {event} event - Keyboard event
     * that will check if user has pushed the enter key.
     * @private
     * @returns {void}
     */
    _onSubmit(event: any) {
        event?.preventDefault?.();

        // Store display name in settings
        this.props.dispatch(updateSettings({
            displayName: this.state.displayName
        }));
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            this._onSubmit(e);
        }
    }
}

export default translate(connect()(DisplayNameForm));

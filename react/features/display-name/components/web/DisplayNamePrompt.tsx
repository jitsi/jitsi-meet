import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';
import { onSetDisplayName } from '../../functions';
import { IProps } from '../../types';

const INITIAL_DISPLAY_NAME = '';

/**
 * The type of the React {@code Component} props of {@link DisplayNamePrompt}.
 */
interface IState {

    /**
     * The name to show in the display name text field.
     */
    displayName: string;

    /**
     * The result of the input validation.
     */
    isValid: boolean;
}

/**
 * Implements a React {@code Component} for displaying a dialog with an field
 * for setting the local participant's display name.
 *
 * @augments Component
 */
class DisplayNamePrompt extends Component<IProps, IState> {
    _onSetDisplayName: (displayName: string) => boolean;

    /**
     * Initializes a new {@code DisplayNamePrompt} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            displayName: INITIAL_DISPLAY_NAME,
            isValid: this.props.validateInput ? this.props.validateInput(INITIAL_DISPLAY_NAME) : true
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onSetDisplayName = onSetDisplayName(props.dispatch, props.onPostSubmit);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const disableCloseDialog = Boolean(this.props.validateInput);

        return (
            <Dialog
                cancel = {{ hidden: true }}
                disableBackdropClose = { disableCloseDialog }
                disableEnter = { !this.state.isValid }
                disableEscape = { disableCloseDialog }
                hideCloseButton = { disableCloseDialog }
                ok = {{
                    disabled: !this.state.isValid,
                    translationKey: 'dialog.Ok'
                }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.displayNameRequired'>
                <Input
                    autoFocus = { true }
                    className = 'dialog-bottom-margin'
                    id = 'dialog-displayName'
                    label = { this.props.t('dialog.enterDisplayName') }
                    name = 'displayName'
                    onChange = { this._onDisplayNameChange }
                    type = 'text'
                    value = { this.state.displayName } />
            </Dialog>
        );
    }

    /**
     * Updates the entered display name.
     *
     * @param {string} value - The new value of the input.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange(value: string) {
        if (this.props.validateInput) {
            this.setState({
                isValid: this.props.validateInput(value),
                displayName: value
            });

            return;
        }
        this.setState({
            displayName: value
        });
    }

    /**
     * Dispatches an action to update the local participant's display name. A
     * name must be entered for the action to dispatch.
     *
     * @private
     * @returns {boolean}
     */
    _onSubmit() {
        return this._onSetDisplayName(this.state.displayName);
    }
}

export default translate(connect()(DisplayNamePrompt));

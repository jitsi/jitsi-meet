// @flow

import Form, { Field } from '@atlaskit/form';
import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link LoginDialog}.
 */
type Props = {

    /**
     * The display name for the local participant obtained from the redux store.
     */
    _localDisplayName: string,

    /**
     * The JitsiConference from which stats will be pulled.
     */
    conference: Object,

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link SpeakerStats}.
 */
type State = {

    /**
     * The stats summary provided by the JitsiConference.
     */
    stats: Object
};

/**
 * React component for displaying a list of speaker stats.
 *
 * @extends Component
 */
class RegisterDialog extends Component<Props, State> {
    /**
     * Initializes a new LoginDialog instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    /**
     * Submit login data.
     *
     * @inheritdoc
     * @returns {void}
     */
    _onSubmit(data) {
        console.log('form data', data);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                cancelKey = { 'dialog.close' }
                submitDisabled = { true }
                titleKey = 'toolbar.register'>
                <div className = 'register-dialog'>
                    <Form onSubmit = { this._onSubmit }>
                        {({ formProps }) => (
                            <form { ...formProps }>
                                <Field
                                    isRequired = { true }
                                    label = 'User name'
                                    name = 'username'>
                                    {({ fieldProps }) => <TextField { ...fieldProps } />}
                                </Field>
                                <Button
                                    appearance = 'primary'
                                    type = 'submit'>
                                  Submit
                                </Button>
                            </form>
                        )}
                    </Form>
                </div>
            </Dialog>
        );
    }
}

export default translate(RegisterDialog);

import React, { Component } from 'react';
import { connect } from 'react-redux';

import InputDialog from '../../../base/dialog/components/native/InputDialog';
import { onSetDisplayName } from '../../functions';
import { IProps } from '../../types';

/**
 * Implements a component to render a display name prompt.
 */
class DisplayNamePrompt extends Component<IProps> {
    _onSetDisplayName: (displayName: string) => boolean;

    /**
     * Initializes a new {@code DisplayNamePrompt} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onSetDisplayName = onSetDisplayName(props.dispatch, props.onPostSubmit);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                descriptionKey = 'dialog.enterDisplayName'
                disableCancel = { true }
                onSubmit = { this._onSetDisplayName }
                titleKey = 'dialog.displayNameRequired'
                validateInput = { this.props.validateInput } />
        );
    }
}

export default connect()(DisplayNamePrompt);

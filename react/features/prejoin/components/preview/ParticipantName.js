// @flow

import React, { Component } from 'react';
import { translate } from '../../../base/i18n';

type Props = {

    /**
     * Flag signaling if the name is ediable or not.
     */
    isEditable: boolean,

    /**
     * Sets the name for the joining user.
     */
    setName: Function,

    /**
     * Used to obtain translations.
     */
    t: Function,

    /**
     * The text to be displayed.
     */
    value: string,
};

/**
 * Participant name - can be an editable input or just the text name.
 *
 * @returns {ReactElement}
 */
class ParticipantName extends Component<Props> {
    /**
     * Initializes a new {@code ParticipantName} instance.
     *
     * @param {Props} props - The props of the component.
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onNameChange = this._onNameChange.bind(this);
    }

    _onNameChange: () => void;

    /**
     * Handler used for changing the guest user name.
     *
     * @returns {undefined}
     */
    _onNameChange({ target: { value } }) {
        this.props.setName(value);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { value, isEditable, t } = this.props;

        return isEditable ? (
            <input
                className = 'prejoin-preview-name prejoin-preview-name--editable'
                onChange = { this._onNameChange }
                placeholder = { t('dialog.enterDisplayName') }
                value = { value } />
        )
            : <div className = 'prejoin-preview-name'>{value}</div>
        ;
    }
}


export default translate(ParticipantName);

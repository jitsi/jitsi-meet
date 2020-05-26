// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

type Props = {

    /**
     * Flag signaling if the name is ediable or not.
     */
    isEditable: boolean,

    /**
     * Joins the current meeting.
     */
    joinConference: Function,

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

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onNameChange = this._onNameChange.bind(this);
    }

    _onKeyDown: () => void;

    /**
     * Joins the conference on 'Enter'.
     *
     * @param {Event} event - Key down event object.
     * @returns {void}
     */
    _onKeyDown(event) {
        if (event.key === 'Enter') {
            this.props.joinConference();
        }
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
        const { _onKeyDown, _onNameChange } = this;

        return isEditable ? (
            <input
                autoFocus = { true }
                className = 'prejoin-preview-name prejoin-preview-name--editable'
                onChange = { _onNameChange }
                onKeyDown = { _onKeyDown }
                placeholder = { t('dialog.enterDisplayName') }
                value = { value } />
        )
            : <div
                className = 'prejoin-preview-name prejoin-preview-name--text'
                onKeyDown = { _onKeyDown }
                tabIndex = '0' >
                {value}
            </div>
        ;
    }
}


export default translate(ParticipantName);

// @flow

import React, { PureComponent } from 'react';

import { translate } from '../../base/i18n';
import { getJwtName } from '../../base/jwt/functions';
import { InputField } from '../../base/premeeting';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';
import { isVpaasMeeting } from '../../billing-counter/functions';

type Props = {

    /**
     * Flag signaling if the name is editable or not.
     */
    isEditable: boolean,

    /**
     * Joins the current meeting.
     */
    joinConference: Function,

    /**
     * Updates settings.
     */
    updateSettings: Function,

    /**
     * The name of the user that is about to join.
     */
    value: string,

    /**
     * Used for translation.
     */
    t: Function
};

/**
 * Component that displays the name in the prejoin screen.
 */
class Name extends PureComponent<Props> {
    /**
     * Initializes a new {@code Name} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onChange = this._onChange.bind(this);
    }

    _onChange: () => void;

    /**
     * Sets the guest participant name.
     *
     * @param {string} displayName - Participant name.
     * @returns {void}
     */
    _onChange(displayName) {
        this.props.updateSettings({
            displayName
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isEditable, joinConference, t, value } = this.props;

        return isEditable ? (
            <InputField
                autoFocus = { true }
                onChange = { this._onChange }
                onSubmit = { joinConference }
                placeHolder = { t('dialog.enterDisplayName') }
                value = { value } />
        )
            : <div className = 'field'>{value}</div>
        ;
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
const mapStateToProps = (state, ownProps) => {
    const isEditable = !isVpaasMeeting(state);
    const name = isEditable ? ownProps.value : getJwtName(state);

    return {
        isEditable,
        name
    };
};

const mapDispatchToProps = {
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(translate(Name));

// @flow

import { PureComponent } from 'react';

import { getFieldValue } from '../../base/react';
import { toggleLobbyMode } from '../actions';

export type Props = {

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

type State = {

    /**
     * The password value entered into the field.
     */
    password: string
};

/**
 * Abstract class to encapsulate the platform common code of the {@code EnableLobbyModeDialog}.
 */
export default class AbstractEnableLobbyModeDialog<P: Props = Props> extends PureComponent<P, State> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            password: ''
        };

        this._onEnableLobbyMode = this._onEnableLobbyMode.bind(this);
        this._onChangePassword = this._onChangePassword.bind(this);
    }

    _onChangePassword: Object => void;

    /**
     * Callback to be invoked when the user changes the password.
     *
     * @param {SyntheticEvent} event - The SyntheticEvent instance of the change.
     * @returns {void}
     */
    _onChangePassword(event) {
        this.setState({
            password: getFieldValue(event)
        });
    }

    _onEnableLobbyMode: () => void;

    /**
     * Callback to be invoked when the user initiates the lobby mode enable flow.
     *
     * @returns {void}
     */
    _onEnableLobbyMode() {
        this.props.dispatch(toggleLobbyMode(true, this.state.password));

        return true;
    }
}

// @flow

import React, { PureComponent } from 'react';

import { translate } from '../../../base/i18n';
import { isLocalParticipantModerator } from '../../../base/participants';
import { Switch } from '../../../base/react';
import { connect } from '../../../base/redux';
import { toggleLobbyMode } from '../../actions';

type Props = {

    /**
     * True if lobby is currently enabled in the conference.
     */
    _lobbyEnabled: boolean,

    /**
     * True if the section should be visible.
     */
    _visible: boolean,

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
     * True if the lobby switch is toggled on.
     */
    lobbyEnabled: boolean
}

/**
 * Implements a security feature section to control lobby mode.
 */
class LobbySection extends PureComponent<Props, State> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            lobbyEnabled: props._lobbyEnabled
        };

        this._onToggleLobby = this._onToggleLobby.bind(this);
    }

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: Object) {
        if (props._lobbyEnabled !== state.lobbyEnabled) {

            return {
                lobbyEnabled: props._lobbyEnabled
            };
        }

        return null;
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _visible, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <>
                <div id = 'lobby-section'>
                    <p className = 'description'>
                        { t('lobby.enableDialogText') }
                    </p>
                    <div className = 'control-row'>
                        <label htmlFor = 'lobby-section-switch'>
                            { t('lobby.toggleLabel') }
                        </label>
                        <Switch
                            id = 'lobby-section-switch'
                            onValueChange = { this._onToggleLobby }
                            value = { this.state.lobbyEnabled } />
                    </div>
                </div>
                <div className = 'separator-line' />
            </>
        );
    }

    _onToggleLobby: () => void;

    /**
     * Callback to be invoked when the user toggles the lobby feature on or off.
     *
     * @returns {void}
     */
    _onToggleLobby() {
        const newValue = !this.state.lobbyEnabled;

        this.setState({
            lobbyEnabled: newValue
        });

        this.props.dispatch(toggleLobbyMode(newValue));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function mapStateToProps(state: Object): $Shape<Props> {
    const { conference } = state['features/base/conference'];
    const { hideLobbyButton } = state['features/base/config'];

    return {
        _lobbyEnabled: state['features/lobby'].lobbyEnabled,
        _visible: conference && conference.isLobbySupported() && isLocalParticipantModerator(state)
            && !hideLobbyButton
    };
}

export default translate(connect(mapStateToProps)(LobbySection));

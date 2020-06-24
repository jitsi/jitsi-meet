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
     * Implements {@code PureComponent#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps, prevState) {
        if (this.props._lobbyEnabled !== prevProps._lobbyEnabled
                && this.state.lobbyEnabled !== prevState.lobbyEnabled) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                lobbyEnabled: this.props._lobbyEnabled
            });
        }
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
                    { t('lobby.enableDialogText') }
                    <div className = 'control-row'>
                        <label>
                            { t('lobby.toggleLabel') }
                        </label>
                        <Switch
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

    return {
        _lobbyEnabled: state['features/lobby'].lobbyEnabled,
        _visible: conference && conference.isLobbySupported() && isLocalParticipantModerator(state)
    };
}

export default translate(connect(mapStateToProps)(LobbySection));

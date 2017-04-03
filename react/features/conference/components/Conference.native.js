import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { Container } from '../../base/react';
import { FilmStrip } from '../../film-strip';
import { LargeVideo } from '../../large-video';
import { Toolbar } from '../../toolbar';

import { styles } from './styles';

/**
 * The timeout in milliseconds after which the toolbar will be hidden.
 *
 * @private
 * @type {number}
 */
const _TOOLBAR_TIMEOUT_MS = 5000;

/**
 * The conference page of the mobile (i.e. React Native) application.
 */
class Conference extends Component {
    /**
     * Conference component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: React.PropTypes.func
    }

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = { toolbarVisible: true };

        /**
         * The numerical ID of the timeout in milliseconds after which the
         * toolbar will be hidden. To be used with
         * {@link WindowTimers#clearTimeout()}.
         *
         * @private
         */
        this._toolbarTimeout = undefined;

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Inits the toolbar timeout after the component is initially rendered.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidMount() {
        this._setToolbarTimeout(this.state.toolbarVisible);
    }

    /**
     * Inits new connection and conference when conference screen is entered.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        this.props.dispatch(connect());
    }

    /**
     * Destroys connection, conference and local tracks when conference screen
     * is left. Clears {@link #_toolbarTimeout} before the component unmounts.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._clearToolbarTimeout();

        this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const toolbarVisible = this.state.toolbarVisible;

        return (
            <Container
                onClick = { this._onClick }
                style = { styles.conference }
                touchFeedback = { false }>

                <LargeVideo />
                <Toolbar visible = { toolbarVisible } />
                <FilmStrip visible = { !toolbarVisible } />

                <DialogContainer />

            </Container>
        );
    }

    /**
     * Clears {@link #_toolbarTimeout} if any.
     *
     * @private
     * @returns {void}
     */
    _clearToolbarTimeout() {
        if (this._toolbarTimeout) {
            clearTimeout(this._toolbarTimeout);
            this._toolbarTimeout = undefined;
        }
    }

    /**
     * Changes the value of the toolbarVisible state, thus allowing us to
     * 'switch' between toolbar and filmstrip views and change the visibility of
     * the above.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const toolbarVisible = !this.state.toolbarVisible;

        this.setState({ toolbarVisible });

        this._setToolbarTimeout(toolbarVisible);
    }

    /**
     * Triggers the default toolbar timeout.
     *
     * @param {boolean} toolbarVisible - Indicates if the toolbar is currently
     * visible.
     * @private
     * @returns {void}
     */
    _setToolbarTimeout(toolbarVisible) {
        this._clearToolbarTimeout();
        if (toolbarVisible) {
            this._toolbarTimeout
                = setTimeout(this._onClick, _TOOLBAR_TIMEOUT_MS);
        }
    }
}

export default reactReduxConnect()(Conference);

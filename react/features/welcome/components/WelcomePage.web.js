import React from 'react';
import { connect } from 'react-redux';

import {
    AbstractWelcomePage,
    mapStateToProps
} from './AbstractWelcomePage';
import { styles } from './styles';

/**
 * The web container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * Renders a prompt for entering a room name.
     *
     * @returns {ReactElement}
     */
    render() {
        /* eslint-disable react/jsx-no-bind */

        return (
            <div style = { styles.container }>
                { this._renderLocalVideo() }
                <div style = { styles.roomContainer }>
                    <p style = { styles.title }>Enter room name</p>
                    <input
                        onChange = { ev => this._onRoomChange(ev.target.value) }
                        style = { styles.textInput }
                        type = 'text'
                        value = { this.state.room || '' } />
                    <button
                        disabled = { this._isJoinDisabled() }
                        onClick = { this._onJoinClick }
                        style = { styles.button }>JOIN</button>
                </div>
            </div>
        );

        /* eslint-enable react/jsx-no-bind */
    }
}

/**
 * WelcomePage component's property types.
 *
 * @static
 */
WelcomePage.propTypes = AbstractWelcomePage.propTypes;

export default connect(mapStateToProps)(WelcomePage);

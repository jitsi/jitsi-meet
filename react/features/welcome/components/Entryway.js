import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import BlankPage from './BlankPage';
import WelcomePage from './WelcomePage';

/**
 * A React <tt>Component</tt> which is rendered when there is no (valid) room
 * (name) i.e. it is the opposite of <tt>Conference</tt>. Generally and
 * historically, it is <tt>WelcomePage</tt>. However, Jitsi Meet SDK for Android
 * and iOS allows the use of the (JavaScript) app without <tt>WelcomePage</tt>
 * and it needs to display something between conferences.
 */
class Entryway extends Component {
    /**
     * <tt>Entryway</tt>'s React <tt>Component</tt> prop types.
     */
    static propTypes = {
        /**
         * The indicator which determines whether <tt>WelcomePage</tt> is (to
         * be) rendered.
         *
         * @private
         */
        _welcomePageEnabled: PropTypes.bool
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            this.props._welcomePageEnabled ? <WelcomePage /> : <BlankPage />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated Entryway's props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _welcomePageEnabled: boolean
 * }}
 */
function _mapStateToProps(state) {
    let welcomePageEnabled;

    if (navigator.product === 'ReactNative') {
        // We introduced the welcomePageEnabled prop on App in Jitsi Meet SDK
        // for Android and iOS. There isn't a strong reason not to introduce it
        // on Web but there're a few considerations to be taken before I go
        // there among which:
        // - Enabling/disabling the Welcome page on Web historically
        // automatically redirects to a random room and that does not make sense
        // on mobile (right now).
        const { app } = state['features/app'];

        welcomePageEnabled = Boolean(app && app.props.welcomePageEnabled);
    } else {
        welcomePageEnabled = true;
    }

    return {
        _welcomePageEnabled: welcomePageEnabled
    };
}

export default connect(_mapStateToProps)(Entryway);

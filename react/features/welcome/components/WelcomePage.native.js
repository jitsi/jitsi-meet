import React from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import { ColorSchemeRegistry } from '../../base/color-scheme';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { setScreen } from '../actions';
import {
    AbstractWelcomePage,
    _mapStateToProps as _abstractMapStateToProps
} from './AbstractWelcomePage';
import Tutorial from './Tutorial';

const WelcomePageLayout = () => <Tutorial />;

/**
 * The native container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs. Creates a local video track if none
     * is available and the camera permission was already granted.
     *
     * @inheritdoc
     * @returns {void}
     */
    async checkIsFirstTimeLoading() {
        try {
            const launchedBefore = await AsyncStorage.getItem('LAUNCHED_BEFORE');

            if (launchedBefore === 'true') {
                this.props.dispatch(setScreen('done'));
            } else {
                this.props.dispatch(setScreen('stepOne'));
            }
        } catch (e) {
            console.error(e);
            this.props.dispatch(setScreen('stepOne'));
        }
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs. Creates a local video track if none
     * is available and the camera permission was already granted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();
        this.checkIsFirstTimeLoading();
    }

    /**
     * Implements React's {@link Component#render()}. Renders a prompt for
     * entering a room name.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (<WelcomePageLayout
            _headerStyles = { this.props._headerStyles } />);
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        _headerStyles: ColorSchemeRegistry.get(state, 'Header')
    };
}

export default translate(connect(_mapStateToProps)(WelcomePage));

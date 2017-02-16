/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import UIEvents from '../../../../service/UI/UIEvents';

import { resetAlwaysVisibleToolbar } from '../actions';
import {
    abstractMapStateToProps,
    showCustomToolbarPopup
} from '../functions';
import Notice from './Notice';
import PrimaryToolbar from './PrimaryToolbar';
import SecondaryToolbar from './SecondaryToolbar';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

/**
 * Implements the conference toolbar on React.
 */
class Toolbar extends Component {

    /**
     * App component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Handler dispatching reset always visible toolbar action.
         */
        _onResetAlwaysVisibleToolbar: React.PropTypes.func,

        /**
         * Represents conference subject.
         */
        _subject: React.PropTypes.string,

        /**
         * Flag showing whether to set subject slide in animation.
         */
        _subjectSlideIn: React.PropTypes.bool,

        /**
         * Property containing toolbar timeout id.
         */
        _timeoutId: React.PropTypes.number
    };

    /**
     * Invokes reset always visible toolbar after mounting the component and
     * registers legacy UI listeners.
     *
     * @returns {void}
     */
    componentDidMount(): void {
        this.props._onResetAlwaysVisibleToolbar();

        APP.UI.addListener(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
            showCustomToolbarPopup);
    }

    /**
     *  Unregisters legacy UI listeners.
     *
     *  @returns {void}
     */
    componentWillUnmount(): void {
        APP.UI.removeListener(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
            showCustomToolbarPopup);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): ReactElement<*> {
        return (
            <div>
                {
                    this._renderSubject()
                }
                {
                    this._renderToolbars()
                }
                <div id = 'sideToolbarContainer' />
            </div>
        );
    }

    /**
     * Returns React element representing toolbar subject.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderSubject(): ReactElement<*> | null {
        const { _subjectSlideIn, _subject } = this.props;
        const classNames = [ 'subject' ];

        if (!_subject) {
            return null;
        }

        if (_subjectSlideIn) {
            classNames.push('subject_slide-in');
        } else {
            classNames.push('subject_slide-out');
        }

        // XXX: Since chat is now not reactified we have to dangerously set
        // inner HTML into the component. This has to be refactored while
        // reactification of the Chat.js
        const innerHtml = {
            __html: _subject
        };

        return (
            <div
                className = { classNames.join(' ') }

                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML = { innerHtml }
                id = 'subject' />
        );
    }

    /**
     * Renders primary and secondary toolbars.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderToolbars(): ReactElement<*> | null {
        // We should not show the toolbars till timeout object will be
        // initialized.
        if (this.props._timeoutId === null) {
            return null;
        }

        return (
            <div>
                <Notice />
                <PrimaryToolbar />
                <SecondaryToolbar />
            </div>
        );
    }
}

/**
 * Maps parts of Redux actions to component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {{
 *      _onResetAlwaysVisibleToolbar: Function
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Function): Object {
    return {

        /**
         * Dispatches an action resetting always visible toolbar.
         *
         * @returns {Object} Dispatched action.
         */
        _onResetAlwaysVisibleToolbar() {
            dispatch(resetAlwaysVisibleToolbar());
        }
    };
}

/**
 * Maps parts of toolbar state to component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 *     _locked: boolean,
 *     _subjectSlideIn: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state: Object): Object {
    const {
        subject,
        subjectSlideIn,
        timeoutId
    } = state['features/toolbar'];

    return {
        ...abstractMapStateToProps(state),

        /**
         * Property containing conference subject.
         *
         * @protected
         * @type {string}
         */
        _subject: subject,

        /**
         * Flag showing whether to set subject slide in animation.
         *
         * @protected
         * @type {boolean}
         */
        _subjectSlideIn: subjectSlideIn,

        /**
         * Property containing toolbar timeout id.
         *
         * @protected
         * @type {number}
         */
        _timeoutId: timeoutId
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(Toolbar);

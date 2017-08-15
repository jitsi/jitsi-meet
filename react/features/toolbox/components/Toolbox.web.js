/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    setDefaultToolboxButtons,
    setToolboxAlwaysVisible
} from '../actions';
import {
    abstractMapStateToProps
} from '../functions';
import Notice from './Notice';
import PrimaryToolbar from './PrimaryToolbar';
import SecondaryToolbar from './SecondaryToolbar';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

/**
 * Implements the conference toolbox on React/Web.
 */
class Toolbox extends Component {
    /**
     * App component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Indicates if the toolbox should always be visible.
         */
        _alwaysVisible: React.PropTypes.bool,

        /**
         * Handler dispatching setting default buttons action.
         */
        _setDefaultToolboxButtons: React.PropTypes.func,

        /**
         * Handler dispatching reset always visible toolbox action.
         */
        _setToolboxAlwaysVisible: React.PropTypes.func,

        /**
         * Represents conference subject.
         */
        _subject: React.PropTypes.string,

        /**
         * Flag showing whether to set subject slide in animation.
         */
        _subjectSlideIn: React.PropTypes.bool,

        /**
         * Property containing toolbox timeout id.
         */
        _timeoutID: React.PropTypes.number
    };

    /**
     * Invokes reset always visible toolbox after mounting the component and
     * registers legacy UI listeners.
     *
     * @returns {void}
     */
    componentDidMount(): void {
        this.props._setToolboxAlwaysVisible();

        // FIXME The redux action SET_DEFAULT_TOOLBOX_BUTTONS and related source
        // code such as the redux action creator setDefaultToolboxButtons and
        // _setDefaultToolboxButtons were introduced to solve the following bug
        // in the implementation of features/toolbar at the time of this
        // writing: getDefaultToolboxButtons uses interfaceConfig which is not
        // in the redux store at the time of this writing yet interfaceConfig is
        // modified after getDefaultToolboxButtons is called.
        // SET_DEFAULT_TOOLBOX_BUTTONS represents/implements an explicit delay
        // of the invocation of getDefaultToolboxButtons until, heuristically,
        // all existing changes to interfaceConfig have been applied already in
        // our known execution paths.
        this.props._setDefaultToolboxButtons();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render(): ReactElement<*> {
        return (
            <div className = 'toolbox'>
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
     * Returns React element representing toolbox subject.
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
        // In case we're not in alwaysVisible mode the toolbox should not be
        // shown until timeoutID is initialized.
        if (!this.props._alwaysVisible && this.props._timeoutID === null) {
            return null;
        }

        return (
            <div className = 'toolbox-toolbars'>
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
 *     _setDefaultToolboxButtons: Function,
 *     _setToolboxAlwaysVisible: Function
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Function): Object {
    return {
        /**
         * Dispatches a (redux) action to set the default toolbar buttons.
         *
         * @returns {Object} Dispatched action.
         */
        _setDefaultToolboxButtons() {
            dispatch(setDefaultToolboxButtons());
        },

        /**
         * Dispatches a (redux) action to reset the permanent visibility of
         * the Toolbox.
         *
         * @returns {Object} Dispatched action.
         */
        _setToolboxAlwaysVisible() {
            dispatch(setToolboxAlwaysVisible(
                config.alwaysVisibleToolbar === true
                    || interfaceConfig.filmStripOnly));
        }
    };
}

/**
 * Maps parts of toolbox state to component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _alwaysVisible: boolean,
 *     _audioMuted: boolean,
 *     _subjectSlideIn: boolean,
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state: Object): Object {
    const {
        alwaysVisible,
        subject,
        subjectSlideIn,
        timeoutID
    } = state['features/toolbox'];

    return {
        ...abstractMapStateToProps(state),

        /**
         * Indicates if the toolbox should always be visible.
         *
         * @private
         * @type {boolean}
         */
        _alwaysVisible: alwaysVisible,

        /**
         * Property containing conference subject.
         *
         * @private
         * @type {string}
         */
        _subject: subject,

        /**
         * Flag showing whether to set subject slide in animation.
         *
         * @private
         * @type {boolean}
         */
        _subjectSlideIn: subjectSlideIn,

        /**
         * Property containing toolbox timeout id.
         *
         * @private
         * @type {number}
         */
        _timeoutID: timeoutID
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(Toolbox);

import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { TOOLTIP_TO_POPUP_POSITION } from '../constants';
import ToolbarButton from './ToolbarButton';

/**
 * React {@code Component} for displaying a button which will open an inline
 * dialog.
 *
 * @extends Component
 */
class ToolbarButtonWithDialog extends Component {
    /**
     * {@code ToolbarButtonWithDialog}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the button is visible, based on the visibility of the
         * toolbar. Used to automatically hide {@code InlineDialog} if not
         * visible.
         */
        _visible: PropTypes.bool,

        /**
         * A configuration object to describe how {@code ToolbarButton} should
         * render.
         *
         */
        button: PropTypes.object,

        /**
         * The React Component to show within {@code InlineDialog}.
         */
        content: PropTypes.func,

        /**
         * From which side tooltips should display. Will be re-used for
         * displaying the inline dialog for video quality adjustment.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Initializes new {@code ToolbarButtonWithDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the inline dialog should be displayed.
             */
            showDialog: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDialogClose = this._onDialogClose.bind(this);
        this._onDialogToggle = this._onDialogToggle.bind(this);
    }

    /**
     * Automatically close the inline dialog if the button will not be visible.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        if (!nextProps._visible) {
            this._onDialogClose();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _visible, content, tooltipPosition } = this.props;
        const buttonConfiguration = {
            ...this.props.button,
            classNames: [
                ...this.props.button.classNames,
                this.state.showDialog ? 'toggled button-active' : ''
            ]
        };

        const Content = content;

        return (
            <InlineDialog
                content = { <Content onClose = { this._onDialogClose } /> }
                isOpen = { _visible && this.state.showDialog }
                onClose = { this._onDialogClose }
                position = { TOOLTIP_TO_POPUP_POSITION[tooltipPosition] }>
                <ToolbarButton
                    button = { buttonConfiguration }
                    onClick = { this._onDialogToggle }
                    tooltipPosition = { tooltipPosition } />
            </InlineDialog>
        );
    }

    /**
     * Hides the attached inline dialog.
     *
     * @private
     * @returns {void}
     */
    _onDialogClose() {
        this.setState({ showDialog: false });
    }

    /**
     * Toggles the display of the dialog.
     *
     * @private
     * @returns {void}
     */
    _onDialogToggle() {
        this.setState({
            showDialog: !this.state.showDialog
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code ToolbarButtonWithDialog} component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _visible: state['features/toolbox'].visible
    };
}

export default connect(_mapStateToProps)(ToolbarButtonWithDialog);

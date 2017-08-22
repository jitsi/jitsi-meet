import AKInlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { VideoQualityDialog } from './';

import { ToolbarButton } from '../../toolbox';

const DEFAULT_BUTTON_CONFIGURATION = {
    buttonName: 'videoquality',
    classNames: [ 'button', 'icon-visibility' ],
    enabled: true,
    id: 'toolbar_button_videoquality',
    tooltipKey: 'videoStatus.qualityButtonTip'
};

const TOOLTIP_TO_DIALOG_POSITION = {
    bottom: 'bottom center',
    left: 'left middle',
    right: 'right middle',
    top: 'top center'
};

/**
 * React {@code Component} for displaying an inline dialog for changing receive
 * video settings.
 *
 * @extends Component
 */
class VideoQualityButton extends Component {
    /**
     * {@code VideoQualityButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the button is visible, based on the visibility of the
         * toolbar. Used to automatically hide the inline dialog if not visible.
         */
        _visible: React.PropTypes.bool,

        /**
         * From which side tooltips should display. Will be re-used for
         * displaying the inline dialog for video quality adjustment.
         */
        tooltipPosition: React.PropTypes.string
    };

    /**
     * Initializes a new {@code VideoQualityButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the inline dialog for adjusting received video
             * quality is displayed.
             */
            showVideoQualityDialog: false
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
        const { _visible, tooltipPosition } = this.props;
        const buttonConfiguration = {
            ...DEFAULT_BUTTON_CONFIGURATION,
            classNames: [
                ...DEFAULT_BUTTON_CONFIGURATION.classNames,
                this.state.showVideoQualityDialog ? 'toggled button-active' : ''
            ]
        };

        return (
            <AKInlineDialog
                content = { <VideoQualityDialog /> }
                isOpen = { _visible && this.state.showVideoQualityDialog }
                onClose = { this._onDialogClose }
                position = { TOOLTIP_TO_DIALOG_POSITION[tooltipPosition] }>
                <ToolbarButton
                    button = { buttonConfiguration }
                    onClick = { this._onDialogToggle }
                    tooltipPosition = { tooltipPosition } />
            </AKInlineDialog>
        );
    }

    /**
     * Hides the attached inline dialog.
     *
     * @private
     * @returns {void}
     */
    _onDialogClose() {
        this.setState({ showVideoQualityDialog: false });
    }

    /**
     * Toggles the display of the dialog.
     *
     * @private
     * @returns {void}
     */
    _onDialogToggle() {
        this.setState({
            showVideoQualityDialog: !this.state.showVideoQualityDialog
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code VideoQualityButton}
 * component's props.
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

export default connect(_mapStateToProps)(VideoQualityButton);

import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { ToolbarButtonV2 } from '../../toolbox';

import { updateDialInNumbers } from '../actions';

import { InfoDialogButton, mapStateToProps } from './InfoDialogButton';
import { InfoDialog } from './info-dialog';

/**
 * A React Component for displaying a button which opens a dialog with
 * information about the conference and with ways to invite people.
 *
 * @extends InfoDialogButton
 */
class InfoDialogButtonV2 extends InfoDialogButton {
    /**
     * {@code InfoDialogButtonV2} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...InfoDialogButton.propTypes,

        /**
         * Phone numbers for dialing into the conference.
         */
        _dialInNumbers: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.array
        ]),

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Set a timeout to automatically hide the {@code InfoDialog}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        super.componentDidMount();

        if (!this.props._dialInNumbers) {
            this.props.dispatch(updateDialInNumbers());
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _showDialog, _toolboxVisible, t } = this.props;
        const iconClass = `icon-info ${_showDialog ? 'toggled' : ''}`;

        return (
            <div className = 'toolbox-button-wth-dialog'>
                <InlineDialog
                    content = { <InfoDialog
                        autoUpdateNumbers = { false }
                        onClose = { this._onDialogClose }
                        onMouseOver = { this._onDialogMouseOver } /> }
                    isOpen = { _toolboxVisible && _showDialog }
                    onClose = { this._onDialogClose }
                    position = { 'top right' }>
                    <ToolbarButtonV2
                        iconName = { iconClass }
                        onClick = { this._onDialogToggle }
                        tooltip = { t('info.tooltip') } />
                </InlineDialog>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code InfoDialogButtonV2}
 * component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialInNumbers: Object,
 *     _shouldAutoClose: boolean,
 *     _showDialog: boolean,
 *     _toolboxVisible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        ...mapStateToProps(state),
        _dialInNumbers: state['features/invite'].numbers
    };
}

export default translate(connect(_mapStateToProps)(InfoDialogButtonV2));

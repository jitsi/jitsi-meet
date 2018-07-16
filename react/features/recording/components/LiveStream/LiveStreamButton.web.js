// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import { getLocalParticipant } from '../../../base/participants';

import AbstractLiveStreamButton, {
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from './AbstractLiveStreamButton';

declare var interfaceConfig: Object;

type Props = AbstractProps & {

    /**
     * True if the button should be disabled, false otherwise.
     *
     * NOTE: On web, if the feature is not disabled on purpose, then we still
     * show the button but disabled and with a tooltip rendered on it,
     * explaining why it's not available.
     */
    _disabled: boolean,

    /**
     * Tooltip for the button when it's disabled in a certain way.
     */
    _liveStreamDisabledTooltipKey: ?string
}

/**
 * An implementation of a button for starting and stopping live streaming.
 */
class LiveStreamButton extends AbstractLiveStreamButton<Props> {
    iconName = 'icon-public';
    toggledIconName = 'icon-public';

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.tooltip = props._liveStreamDisabledTooltipKey;
    }

    /**
     * Implements {@code Component}'s componentWillReceiveProps.
     *
     * @inheritdoc
     */
    componentWillReceiveProps(newProps: Props) {
        this.tooltip = newProps._liveStreamDisabledTooltipKey;
    }

    /**
     * Helper function to be implemented by subclasses, which returns a React
     * Element to display (a beta tag) at the end of the button.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _getElementAfter() {
        return (
            <span className = 'beta-tag'>
                { this.props.t('recording.beta') }
            </span>
        );
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * boolean value indicating if this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code LiveStreamButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _isLiveStreamRunning: boolean,
 *     _disabled: boolean,
 *     visible: boolean
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const abstractProps = _abstractMapStateToProps(state, ownProps);
    const localParticipant = getLocalParticipant(state);
    const { features = {} } = localParticipant;
    let { visible } = ownProps;

    let _disabled = false;
    let _liveStreamDisabledTooltipKey;

    if (!abstractProps.visible
            && String(features.livestreaming) !== 'disabled') {
        _disabled = true;

        // button and tooltip
        if (state['features/base/jwt'].isGuest) {
            _liveStreamDisabledTooltipKey
                = 'dialog.liveStreamingDisabledForGuestTooltip';
        } else {
            _liveStreamDisabledTooltipKey
                = 'dialog.liveStreamingDisabledTooltip';
        }
    }

    if (typeof visible === 'undefined') {
        visible = interfaceConfig.TOOLBAR_BUTTONS.includes('livestreaming')
            && (abstractProps.visible || _liveStreamDisabledTooltipKey);
    }

    return {
        ...abstractProps,
        _disabled,
        _liveStreamDisabledTooltipKey,
        visible
    };
}

export default translate(connect(_mapStateToProps)(LiveStreamButton));

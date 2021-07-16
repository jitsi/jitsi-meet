// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React from 'react';

import { connect } from '../../../../base/redux';
import { SMALL_MOBILE_WIDTH } from '../../../../base/responsive-ui/constants';
import { toggleShareScreenSettings } from '../../../actions';
import { getDesktopShareSettingsVisibility } from '../../../functions';

import ScreenShareSettingsContent from './ScreenShareSettingsContent';

type Props = {

    /**
     * Component children (the Desktop share button).
     */
    children: React$Node,

    /**
     * Flag controlling the visibility of the popup.
     */
    isOpen: boolean,

    /**
     * Callback executed when the popup closes.
     */
    onClose: Function,

    /**
     * The popup placement enum value.
     */
    popupPlacement: string
};

/**
 * Popup with screen share settings.
 *
 * @returns {ReactElement}
 */
const ScreenShareSettingsPopup = ({ children, isOpen, onClose, popupPlacement }: Props) => (
    <div className = 'audio-preview'>
        <InlineDialog
            content = { <ScreenShareSettingsContent /> }
            isOpen = { isOpen }
            onClose = { onClose }
            placement = { popupPlacement }>
            {children}
        </InlineDialog>
    </div>
);

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        popupPlacement: clientWidth <= SMALL_MOBILE_WIDTH ? 'auto' : 'top-start',
        isOpen: getDesktopShareSettingsVisibility(state)
    };
}

const mapDispatchToProps = {
    onClose: toggleShareScreenSettings
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ScreenShareSettingsPopup);

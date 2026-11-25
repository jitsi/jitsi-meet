import React from 'react';

import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { enableTutorMode, disableTutorMode } from '../../actions';
import { isTutorModeFeatureAvailable, isTutorModeEnabled } from '../../functions.any';

interface IProps extends AbstractButtonProps {
    /**
     * Whether tutor mode is currently enabled.
     */
    enabled?: boolean;

    /**
     * Whether the tutor mode feature is available for the local participant.
     */
    available?: boolean;
}

/**
 * Component that renders a tutor mode button in the toolbox.
 */
class TutorModeButton extends AbstractButton<IProps> {
    accessibleName = 'tutorMode.button';
    id = 'tutor-mode';
    label = 'tutorMode.button';
    tooltip = 'tutorMode.buttonTooltip';

    /**
     * Handles click events on the button.
     */
    override handleClick = () => {
        const { dispatch, enabled } = this.props;

        if (enabled) {
            dispatch(disableTutorMode());
        } else {
            dispatch(enableTutorMode());
        }
    };

    override render() {
        const { available } = this.props;

        if (!available) {
            return null;
        }

        return super.render();
    }
}

export default TutorModeButton;
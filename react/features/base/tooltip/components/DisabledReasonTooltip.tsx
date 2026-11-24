import React, { ReactElement } from 'react';

import Tooltip from './Tooltip';

interface IProps {

    /**
     * The disabled control.
     */
    children: ReactElement;

    /**
     * Why the control is disabled, already translated. Without one the control is rendered alone.
     */
    reason?: string;
}

/**
 * Explains a disabled control in a tooltip.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
const DisabledReasonTooltip = ({ children, reason }: IProps) => (
    reason ? <Tooltip content = { reason }>{ children }</Tooltip> : children
);

export default DisabledReasonTooltip;

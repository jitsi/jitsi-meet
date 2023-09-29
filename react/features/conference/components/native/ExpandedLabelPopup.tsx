import React from 'react';

import BaseTheme from '../../../base/ui/components/BaseTheme';

import { EXPANDED_LABELS } from './constants';

interface IProps {

    /**
     * The selected label to show details.
     */
    visibleExpandedLabel?: string;
}

const ExpandedLabelPopup = ({ visibleExpandedLabel }: IProps) => {
    if (visibleExpandedLabel) {
        const expandedLabel = EXPANDED_LABELS[visibleExpandedLabel as keyof typeof EXPANDED_LABELS];

        if (expandedLabel) {
            const LabelComponent = expandedLabel.component;

            const { props, alwaysOn } = expandedLabel;
            const style = {
                top: alwaysOn ? BaseTheme.spacing[6] : BaseTheme.spacing[1]
            };

            return (<LabelComponent
                { ...props }
                style = { style } />);
        }
    }

    return null;
};

export default ExpandedLabelPopup;

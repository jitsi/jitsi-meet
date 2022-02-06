// @flow

import React from 'react';

import BaseTheme from '../../../base/ui/components/BaseTheme';

import { EXPANDED_LABELS } from './constants';

type Props = {

    /**
     * The selected label to show details.
     */
    visibleExpandedLabel: ?string
}

const ExpandedLabelPopup = ({ visibleExpandedLabel }: Props) => {
    if (visibleExpandedLabel) {
        const expandedLabel = EXPANDED_LABELS[visibleExpandedLabel];

        if (expandedLabel) {
            const LabelComponent = expandedLabel.component || expandedLabel;
            const { props, alwaysOn } = expandedLabel || {};
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

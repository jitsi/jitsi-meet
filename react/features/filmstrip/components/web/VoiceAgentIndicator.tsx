import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { IconAI } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';

const useStyles = makeStyles()(theme => {
    return {
        indicator: {
            backgroundColor: theme.palette.action01,
            borderRadius: '4px',
            boxSizing: 'border-box',
            display: 'inline-block',
            left: theme.spacing(1),
            padding: '4px',
            position: 'absolute',
            top: theme.spacing(1),
            zIndex: 10
        }
    };
});

/**
 * Thumbnail badge marking a voice agent's tile as an AI agent.
 *
 * @returns {ReactElement}
 */
const VoiceAgentIndicator = () => {
    const { classes, theme } = useStyles();

    return (
        <div className = { classes.indicator }>
            <BaseIndicator
                icon = { IconAI }
                iconColor = { theme.palette.icon01 }
                iconSize = { 16 }
                tooltipKey = 'voiceAgents.thumbnailTooltip'
                tooltipPosition = 'top' />
        </div>
    );
};

export default VoiceAgentIndicator;

/* @flow */
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Tooltip } from '../../../base/tooltip';
import { FACIAL_EXPRESSION_EMOJIS } from '../../../facial-recognition/constants.js';

const useStyles = makeStyles(() => {
    return {
        speakerStatsLabels: {
            padding: '7px 0px'
        }

    };
});

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsLabels}.
 */
type Props = {

    /**
     * True if the client width is les than 750.
     */
    reduceExpressions: boolean,

    /**
     * True if the facial recognition is not disabled.
     */
    showFacialExpressions: boolean,
};

const SpeakerStatsLabels = (props: Props) => {
    const { t } = useTranslation();
    const classes = useStyles();

    const FacialExpressionsLabels = () => (
        props.reduceExpressions
            ? Object.keys(FACIAL_EXPRESSION_EMOJIS)
                .filter(expression => ![ 'angry', 'fearful', 'disgusted' ].includes(expression))
            : Object.keys(FACIAL_EXPRESSION_EMOJIS)).map(
            expression => (
                <div
                    className = 'speaker-stats-item__expression'
                    key = { expression }>
                    <Tooltip
                        content = { t(`speakerStats.${expression}`) }
                        position = { 'top' } >
                        <div
                            // eslint-disable-next-line react-native/no-inline-styles
                            style = {{ fontSize: 17 }}>

                            { FACIAL_EXPRESSION_EMOJIS[expression] }
                        </div>

                    </Tooltip>
                </div>
            )
    );

    return (
        <div className = { `speaker-stats-row ${classes.speakerStatsLabels}` }>
            <div className = 'speaker-stats-item__avatar' />

            <div className = 'speaker-stats-item__name-time'>
                <div>
                    { t('speakerStats.name') }
                </div>
                <div>
                    { t('speakerStats.speakerTime') }
                </div>
            </div>

            {
                props.showFacialExpressions
                && <FacialExpressionsLabels />
            }
        </div>
    );
};

export default SpeakerStatsLabels;

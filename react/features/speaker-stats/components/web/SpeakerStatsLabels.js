/* @flow */
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Tooltip } from '../../../base/tooltip';
import { FACIAL_EXPRESSION_EMOJIS } from '../../../facial-recognition/constants.js';

const useStyles = makeStyles(() => {
    return {
        labels: {
            padding: '7px 0px',
            height: 20
        },
        emojis: {
            paddingLeft: 27
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
                    className = 'expression text-large'
                    key = { expression }>
                    <Tooltip
                        content = { t(`speakerStats.${expression}`) }
                        position = { 'top' } >
                        <div>
                            { FACIAL_EXPRESSION_EMOJIS[expression] }
                        </div>

                    </Tooltip>
                </div>
            )
    );
    const nameTimeClass = `name-time${
        props.showFacialExpressions ? ' name-time_expressions-on' : ''
    }`;

    return (
        <div className = { `row ${classes.labels}` }>
            <div className = 'avatar' />

            <div className = { nameTimeClass }>
                <div>
                    { t('speakerStats.name') }
                </div>
                <div>
                    { t('speakerStats.speakerTime') }
                </div>
            </div>

            {
                props.showFacialExpressions
                && <div className = { `expressions ${classes.emojis}` }>
                    <FacialExpressionsLabels />
                </div>

            }
        </div>
    );
};

export default SpeakerStatsLabels;

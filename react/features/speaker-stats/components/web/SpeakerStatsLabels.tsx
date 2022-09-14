import { Theme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';
import { FACE_EXPRESSIONS_EMOJIS } from '../../../face-landmarks/constants';

const useStyles = makeStyles()((theme: Theme) => {
    return {
        labels: {
            padding: '22px 0 7px 0',
            height: 20
        },
        emojis: {
            paddingLeft: 27,
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsLabels}.
 */
type Props = {

    /**
     * True if the face expressions detection is not disabled.
     */
    showFaceExpressions: boolean;
};

const SpeakerStatsLabels = (props: Props) => {
    const { t } = useTranslation();
    const { classes } = useStyles();
    const nameTimeClass = `name-time${
        props.showFaceExpressions ? ' name-time_expressions-on' : ''
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
                props.showFaceExpressions
                && <div className = { `expressions ${classes.emojis}` }>
                    {Object.keys(FACE_EXPRESSIONS_EMOJIS).map(
                        expression => (
                            <div
                                className = 'expression'
                                key = { expression }>
                                <Tooltip
                                    content = { t(`speakerStats.${expression}`) }
                                    position = { 'top' } >
                                    <div>
                                        {FACE_EXPRESSIONS_EMOJIS[expression as keyof typeof FACE_EXPRESSIONS_EMOJIS]}
                                    </div>

                                </Tooltip>
                            </div>
                        )
                    )}
                </div>
            }
        </div>
    );
};

export default SpeakerStatsLabels;

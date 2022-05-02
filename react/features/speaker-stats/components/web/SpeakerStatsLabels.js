/* @flow */
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Tooltip } from '../../../base/tooltip';
import { FACE_EXPRESSIONS_EMOJIS } from '../../../face-landmarks/constants.js';

const useStyles = makeStyles(theme => {
    return {
        labels: {
            padding: '22px 0 7px 0',
            height: 20
        },
        emojis: {
            paddingLeft: 27,
            ...theme.typography.bodyShortRegularLarge,
            lineHeight: `${theme.typography.bodyShortRegular.lineHeightLarge}px`
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
    showFaceExpressions: boolean,
};

const SpeakerStatsLabels = (props: Props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const FaceExpressionsLabels = () => Object.keys(FACE_EXPRESSIONS_EMOJIS).map(
            expression => (
                <div
                    className = 'expression'
                    key = { expression }>
                    <Tooltip
                        content = { t(`speakerStats.${expression}`) }
                        position = { 'top' } >
                        <div>
                            { FACE_EXPRESSIONS_EMOJIS[expression] }
                        </div>

                    </Tooltip>
                </div>
            )
    );
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
                    <FaceExpressionsLabels />
                </div>
            }
        </div>
    );
};

export default SpeakerStatsLabels;

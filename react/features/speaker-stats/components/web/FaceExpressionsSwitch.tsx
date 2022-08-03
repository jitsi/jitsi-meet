import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Switch from '../../../base/ui/components/web/Switch';
import { Theme } from '../../../base/ui/types';

// @ts-ignore
const useStyles = makeStyles((theme: Theme) => {
    return {
        switchContainer: {
            display: 'flex',
            alignItems: 'center'
        },

        switchLabel: {
            marginRight: 10,
            ...theme.typography.bodyShortRegular,
            lineHeight: `${theme.typography.bodyShortRegular.lineHeight}px`
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link ToggleFaceExpressionsButton}.
 */
type Props = {

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onChange: (checked?: boolean) => void,

    /**
     * The state of the button.
     */
    showFaceExpressions: boolean,

};

/**
 * React component for toggling face expressions grid.
 *
 * @returns {React$Element<any>}
 */
export default function FaceExpressionsSwitch({ onChange, showFaceExpressions }: Props) {
    const classes = useStyles();
    const { t } = useTranslation();

    return (
        <div className = { classes.switchContainer } >
            <label
                className = { classes.switchLabel }
                htmlFor = 'face-expressions-switch'>
                { t('speakerStats.displayEmotions')}
            </label>
            <Switch
                checked = { showFaceExpressions }
                id = 'face-expressions-switch'
                onChange = { onChange } />
        </div>
    );
}

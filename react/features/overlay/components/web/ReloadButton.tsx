import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { reloadNow } from '../../../app/actions.web';
import Button from '../../../base/ui/components/web/Button';

/**
 * The type of the React {@code Component} props of {@link ReloadButton}.
 */
interface IProps {

    /**
     * The translation key for the text in the button.
     */
    textKey: string;
}

const useStyles = makeStyles()(theme => {
    return {
        button: {
            margin: `${theme.spacing(2)} auto 0`
        }
    };
});

const ReloadButton = ({ textKey }: IProps) => {
    const dispatch = useDispatch();
    const { classes } = useStyles();

    const onClick = useCallback(() => {
        dispatch(reloadNow());
    }, []);

    return (
        <Button
            className = { classes.button }
            labelKey = { textKey }
            onClick = { onClick } />
    );
};

export default ReloadButton;

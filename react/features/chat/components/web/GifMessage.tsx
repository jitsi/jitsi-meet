import React from 'react';
import { makeStyles } from 'tss-react/mui';

interface IProps {

    /**
     * URL of the GIF.
     */
    url: string;
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            display: 'flex',
            justifyContent: 'center',
            overflow: 'hidden',
            maxHeight: '150px',

            '& img': {
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                flexGrow: 1
            }
        }
    };
});

const GifMessage = ({ url }: IProps) => {
    const { classes: styles } = useStyles();

    return (<div className = { styles.container }>
        <img
            alt = { url }
            src = { url } />
    </div>);
};

export default GifMessage;

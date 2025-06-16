import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { useStore } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../base/i18n/functions';
import { setSeeWhatIsBeingShared } from '../actions.web';

const useStyles = makeStyles()(theme => {
    return {
        overlayContainer: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.palette.ui02,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        },
        laptop: {
            width: '88px',
            height: '56px',
            boxSizing: 'border-box',
            border: '3px solid',
            borderColor: theme.palette.text01,
            borderRadius: '6px'
        },
        laptopStand: {
            width: '40px',
            height: '4px',
            backgroundColor: theme.palette.text01,
            boxSizing: 'border-box',
            borderRadius: '6px',
            marginTop: '4px'
        },
        sharingMessage: {
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: '28px',
            marginTop: '24px',
            letterSpacing: '-0.012em',
            color: theme.palette.text01
        },
        showSharing: {
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '14px',
            lineHeight: '20px',
            height: '20px',
            marginTop: '16px',
            color: theme.palette.link01,
            cursor: 'pointer',

            '&:hover': {
                color: theme.palette.link01Hover
            }
        }
    };
});

/**
 * Component that displays a placeholder for when the screen is shared.
 * * @param {Function} t - Function which translate strings.
 *
 * @returns {ReactElement}
 */
const ScreenSharePlaceholder: React.FC<WithTranslation> = ({ t }) => {
    const { classes } = useStyles();
    const store = useStore();

    const updateShowMeWhatImSharing = useCallback(() => {
        store.dispatch(setSeeWhatIsBeingShared(true));
    }, []);

    return (
        <div className = { classes.overlayContainer }>
            <div className = { classes.content }>
                <div className = { classes.laptop } />
                <div className = { classes.laptopStand } />
                <span className = { classes.sharingMessage }>{ t('largeVideo.screenIsShared') }</span>
                <span
                    className = { classes.showSharing }
                    onClick = { updateShowMeWhatImSharing }
                    role = 'button'>{ t('largeVideo.showMeWhatImSharing') }</span>
            </div>
        </div>
    );
};

export default translate(ScreenSharePlaceholder);

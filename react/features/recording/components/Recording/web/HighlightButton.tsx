import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';
import { connect } from 'react-redux';

import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import { IconHighlight } from '../../../../base/icons/svg';
import { MEET_FEATURES } from '../../../../base/jwt/constants';
import Label from '../../../../base/label/components/web/Label';
import Tooltip from '../../../../base/tooltip/components/Tooltip';
import BaseTheme from '../../../../base/ui/components/BaseTheme.web';
import { maybeShowPremiumFeatureDialog } from '../../../../jaas/actions';
import StartRecordingDialog from '../../Recording/web/StartRecordingDialog';
import AbstractHighlightButton, {
    IProps as AbstractProps,
    _abstractMapStateToProps
} from '../AbstractHighlightButton';

interface IProps extends AbstractProps {
    _disabled: boolean;

    /**
     * The message to show within the label's tooltip.
     */
    _tooltipKey: string;

    /**
     * Flag controlling visibility of the component.
     */
    _visible: boolean;

    classes: any;
}

/**
 * The type of the React {@code Component} state of {@link HighlightButton}.
 */
interface IState {

    /**
     * Whether the notification which prompts for starting recording is open is not.
     */
    isNotificationOpen: boolean;
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (theme: Theme) => {
    return {
        container: {
            position: 'relative' as const
        },
        disabled: {
            background: theme.palette.text02
        },
        regular: {
            background: theme.palette.ui10
        },
        highlightNotification: {
            backgroundColor: theme.palette.ui10,
            borderRadius: '6px',
            boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box' as const,
            color: theme.palette.uiBackground,
            fontSize: '14px',
            fontWeight: '400',
            left: '4px',
            padding: '16px',
            position: 'absolute' as const,
            top: '32px',
            width: 320
        },
        highlightNotificationButton: {
            color: theme.palette.action01,
            cursor: 'pointer',
            fontWeight: '600',
            marginTop: '8px'
        }
    };
};

/**
 * React {@code Component} responsible for displaying an action that
 * allows users to highlight a meeting moment.
 */
export class HighlightButton extends AbstractHighlightButton<IProps, IState> {
    /**
     * Initializes a new HighlightButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            isNotificationOpen: false
        };

        this._onOpenDialog = this._onOpenDialog.bind(this);
        this._onWindowClickListener = this._onWindowClickListener.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        window.addEventListener('click', this._onWindowClickListener);
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        window.removeEventListener('click', this._onWindowClickListener);
    }

    /**
    * Handles clicking / pressing the start recording button.
    *
    * @returns {void}
    */
    async _onOpenDialog() {
        const { dispatch } = this.props;
        const dialogShown = await dispatch(maybeShowPremiumFeatureDialog(MEET_FEATURES.RECORDING));

        if (!dialogShown) {
            dispatch(openDialog(StartRecordingDialog));
        }
    }

    /**
    * Handles clicking / pressing the highlight button.
    *
    * @override
    * @param {Event} e - The click event.
    * @returns {void}
    */
    _onClick(e?: React.MouseEvent) {
        e?.stopPropagation();

        const { _disabled } = this.props;

        if (_disabled) {
            this.setState({
                isNotificationOpen: true
            });
        } else {
            super._onClick();
        }
    }

    /**
     * Window click event listener.
     *
     * @returns {void}
     */
    _onWindowClickListener() {
        this.setState({
            isNotificationOpen: false
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _disabled,
            _visible,
            classes,
            t
        } = this.props;

        if (!_visible) {
            return null;
        }

        const className = _disabled ? classes.disabled : classes.regular;
        const tooltipKey = _disabled ? 'recording.highlightMomentDisabled' : 'recording.highlightMoment';

        return (
            <div className = { classes.container }>
                <Tooltip
                    content = { t(tooltipKey) }
                    position = { 'bottom' }>
                    <Label
                        className = { className }
                        icon = { IconHighlight }
                        iconColor = { _disabled ? BaseTheme.palette.text03 : BaseTheme.palette.field01 }
                        id = 'highlightMeetingLabel'
                        onClick = { this._onClick } />
                </Tooltip>
                {this.state.isNotificationOpen && (
                    <div className = { classes.highlightNotification }>
                        {t('recording.highlightMomentDisabled')}
                        <div
                            className = { classes.highlightNotificationButton }
                            onClick = { this._onOpenDialog }>
                            {t('localRecording.start')}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default withStyles(styles)(translate(connect(_abstractMapStateToProps)(HighlightButton)));

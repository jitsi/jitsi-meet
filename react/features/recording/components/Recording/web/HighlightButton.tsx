import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';

// @ts-ignore
import { StartRecordingDialog } from '../..';
import { openDialog } from '../../../../base/dialog/actions';
import { translate } from '../../../../base/i18n/functions';
import { IconHighlight } from '../../../../base/icons/svg';
import { MEET_FEATURES } from '../../../../base/jwt/constants';
import Label from '../../../../base/label/components/web/Label';
import { connect } from '../../../../base/redux/functions';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { Tooltip } from '../../../../base/tooltip';
import BaseTheme from '../../../../base/ui/components/BaseTheme.web';
import { maybeShowPremiumFeatureDialog } from '../../../../jaas/actions';
import AbstractHighlightButton, {
    type Props as AbstractProps,
    _abstractMapStateToProps

    // @ts-ignore
} from '../AbstractHighlightButton';

type Props = AbstractProps & {
    _disabled: boolean;

    /**
     * The message to show within the label's tooltip.
     */
    _tooltipKey: string;

    /**
     * Flag controlling visibility of the component.
     */
    _visible: boolean;
};

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
            position: 'relative'
        },
        disabled: {
            background: theme.palette.text02,
            margin: '0 4px 4px 4px'
        },
        regular: { // @ts-ignore
            background: theme.palette.field02,
            margin: '0 4px 4px 4px'
        },
        highlightNotification: { // @ts-ignore
            backgroundColor: theme.palette.field02,
            borderRadius: '6px',
            boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box',
            color: theme.palette.uiBackground,
            fontSize: '14px',
            fontWeight: '400',
            left: '4px',
            padding: '16px',
            position: 'absolute',
            top: '32px',
            width: 320
        },
        highlightNotificationButton: { // @ts-ignore
            color: theme.palette.field01Focus,
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
export class HighlightButton extends AbstractHighlightButton<Props, IState> {
    /**
     * Initializes a new HighlightButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // @ts-ignore
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
        // @ts-ignore
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

        // @ts-ignore
        const { _disabled } = this.props;

        if (_disabled) {
            // @ts-ignore
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
        // @ts-ignore
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

            // @ts-ignore
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
                {/* @ts-ignore */}
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

// @ts-ignore
export default withStyles(styles)(translate(connect(_abstractMapStateToProps)(HighlightButton)));

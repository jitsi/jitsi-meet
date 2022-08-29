// @flow

import { withStyles } from '@material-ui/styles';
import React, { PureComponent } from 'react';

import { connect } from '../../../../base/redux';
import DeviceStatus from '../../../../prejoin/components/preview/DeviceStatus';
import { Toolbox } from '../../../../toolbox/components/web';
import { getConferenceName } from '../../../conference/functions';
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from '../../../config/constants';
import { getToolbarButtons, isToolbarButtonEnabled } from '../../../config/functions.web';
import { withPixelLineHeight } from '../../../styles/functions.web';

import ConnectionStatus from './ConnectionStatus';
import Preview from './Preview';

type Props = {

    /**
     * The list of toolbar buttons to render.
     */
    _buttons: Array<string>,

    /**
     * The branding background of the premeeting screen(lobby/prejoin).
     */
    _premeetingBackground: string,

    /**
     * The name of the meeting that is about to be joined.
     */
    _roomName: string,

    /**
     * Children component(s) to be rendered on the screen.
     */
    children?: React$Node,

    /**
     * Classes prop injected by withStyles.
     */
    classes: Object,

    /**
     * Additional CSS class names to set on the icon container.
     */
    className?: string,

    /**
     * The name of the participant.
     */
    name?: string,

    /**
     * Indicates whether the copy url button should be shown.
     */
    showCopyUrlButton: boolean,

    /**
     * Indicates whether the device status should be shown.
     */
    showDeviceStatus: boolean,

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
     skipPrejoinButton?: React$Node,

    /**
     * Title of the screen.
     */
    title?: string,

    /**
     * Whether it's used in the 3rdParty prejoin screen or not.
     */
    thirdParty?: boolean,

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean,

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        subtitle: {
            ...withPixelLineHeight(theme.typography.heading5),
            color: theme.palette.text01,
            marginBottom: theme.spacing(4),
            overflow: 'hidden',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
        }
    };
};

/**
 * Implements a pre-meeting screen that can be used at various pre-meeting phases, for example
 * on the prejoin screen (pre-connection) or lobby (post-connection).
 */
class PreMeetingScreen extends PureComponent<Props> {
    /**
     * Default values for {@code Prejoin} component's properties.
     *
     * @static
     */
    static defaultProps = {
        showCopyUrlButton: true,
        showToolbox: true
    };

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _buttons,
            _premeetingBackground,
            _roomName,
            children,
            classes,
            className,
            showDeviceStatus,
            skipPrejoinButton,
            title,
            videoMuted,
            videoTrack
        } = this.props;

        const containerClassName = `premeeting-screen ${className ? className : ''}`;
        const style = _premeetingBackground ? {
            background: _premeetingBackground,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
        } : {};

        return (
            <div className = { containerClassName }>
                <div style = { style }>
                    <div className = 'content'>
                        <ConnectionStatus />

                        <div className = 'content-controls'>
                            <h1 className = 'title'>
                                { title }
                            </h1>
                            <span className = { classes.subtitle }>
                                {_roomName}
                            </span>
                            { children }
                            { _buttons.length && <Toolbox toolbarButtons = { _buttons } /> }
                            { skipPrejoinButton }
                            { showDeviceStatus && <DeviceStatus /> }
                        </div>
                    </div>
                </div>
                <Preview
                    videoMuted = { videoMuted }
                    videoTrack = { videoTrack } />
            </div>
        );
    }
}


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state, ownProps): Object {
    const { hiddenPremeetingButtons } = state['features/base/config'];
    const toolbarButtons = getToolbarButtons(state);
    const premeetingButtons = (ownProps.thirdParty
        ? THIRD_PARTY_PREJOIN_BUTTONS
        : PREMEETING_BUTTONS).filter(b => !(hiddenPremeetingButtons || []).includes(b));

    const { premeetingBackground } = state['features/dynamic-branding'];

    return {
        // For keeping backwards compat.: if we pass an empty hiddenPremeetingButtons
        // array through external api, we have all prejoin buttons present on premeeting
        // screen regardless of passed values into toolbarButtons config overwrite.
        // If hiddenPremeetingButtons is missing, we hide the buttons according to
        // toolbarButtons config overwrite.
        _buttons: hiddenPremeetingButtons
            ? premeetingButtons
            : premeetingButtons.filter(b => isToolbarButtonEnabled(b, toolbarButtons)),
        _premeetingBackground: premeetingBackground,
        _roomName: getConferenceName(state)
    };
}

export default connect(mapStateToProps)(withStyles(styles)(PreMeetingScreen));

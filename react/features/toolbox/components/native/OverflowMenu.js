// @flow

import React, { PureComponent } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Collapsible from 'react-native-collapsible';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { BottomSheet, hideDialog, isDialogOpen } from '../../../base/dialog';
import { IconDragHandle } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { SharedDocumentButton } from '../../../etherpad';
import { InviteButton } from '../../../invite';
import { AudioRouteButton } from '../../../mobile/audio-mode';
import { LiveStreamButton, RecordButton } from '../../../recording';
import { RoomLockButton } from '../../../room-lock';
import { ClosedCaptionButton } from '../../../subtitles';
import { TileViewButton } from '../../../video-layout';
import HelpButton from '../HelpButton';

import AudioOnlyButton from './AudioOnlyButton';
import MoreOptionsButton from './MoreOptionsButton';
import RaiseHandButton from './RaiseHandButton';
import ToggleCameraButton from './ToggleCameraButton';
import styles from './styles';
import MuteEveryoneElseButton from './MuteEveryoneElseButton';

import { jitsiLocalStorage } from 'js-utils';

import { requireNativeComponent } from 'react-native';
import {getDisplayMedia} from 'react-native-webrtc';
import { getLocalTrack, getLocalVideoTrack, createLocalTracksF, replaceLocalTrack } from '../../../base/tracks';
import DesktopSharingButton from './DesktopSharingButton';
import {NativeModules} from 'react-native';
const {WebRTCModule} = NativeModules;

const RecordNativeComponent = requireNativeComponent('RecordComponent');


/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the dialog feature.
     */
    _bottomSheetStyles: StyleType,

    /**
     * True if the overflow menu is currently visible, false otherwise.
     */
    _isOpen: boolean,

    /**
     * Whether the recoding button should be enabled or not.
     */
    _recordingEnabled: boolean,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function
};

type State = {

    /**
     * True if the bottom scheet is scrolled to the top.
     */
    scrolledToTop: boolean,

    /**
     * True if the 'more' button set needas to be rendered.
     */
    showMore: boolean,

    /**
     *  whether we are a moderator - we currently check whether there is a sessionId saved in the app
     */
    isModerator: boolean
}

/**
 * The exported React {@code Component}. We need it to execute
 * {@link hideDialog}.
 *
 * XXX It does not break our coding style rule to not utilize globals for state,
 * because it is merely another name for {@code export}'s {@code default}.
 */
let OverflowMenu_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class OverflowMenu extends PureComponent<Props, State> {
    /**
     * Initializes a new {@code OverflowMenu} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.clicked = false;

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onSwipe = this._onSwipe.bind(this);
        this._onToggleMenu = this._onToggleMenu.bind(this);
        this._renderMenuExpandToggle = this._renderMenuExpandToggle.bind(this);
        this._renderModeratorButtons = this._renderModeratorButtons.bind(this)

        var sessionId = jitsiLocalStorage.getItem('sessionId');
        console.log(jitsiLocalStorage.getItem('sessionId'))
        if(sessionId){
            this.state = {
                scrolledToTop: true,
                showMore: false,
                isModerator:true

            };
        }else{ 
            this.state = {
                scrolledToTop: true,
                showMore: false,
                isModerator:false

            };
         }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _bottomSheetStyles, __localVideo } = this.props;
        const { showMore } = this.state;
        let {dispatch} = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: _bottomSheetStyles.buttons
        };

        const moreOptionsButtonProps = {
            ...buttonProps,
            afterClick: this._onToggleMenu,
            visible: !showMore
        };

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                onSwipe = { this._onSwipe }
                renderHeader = { this._renderMenuExpandToggle }>
                <AudioRouteButton { ...buttonProps } />
                <InviteButton { ...buttonProps } />
                <AudioOnlyButton { ...buttonProps } />
                <RaiseHandButton { ...buttonProps } />
                <MoreOptionsButton { ...moreOptionsButtonProps } />
                <Collapsible collapsed = { !showMore }>
                {this._renderModeratorButtons(buttonProps)}          
                    <ToggleCameraButton { ...buttonProps } />
                    <TileViewButton { ...buttonProps } />
                    <RecordNativeComponent 
                        onUpdate={event => console.log(event.nativeEvent.frameData.length)} 
                        style={{width: 50, height: 50}} 
                        // onClick={() => {console.log(WebRTCModule.checkArgss("type"));}}
                        ref={comp => {
                            this.recordComponent = comp; 
                            // if (!this.clicked) {
                            //     getDisplayMedia({"video": {}}).then((desktopStream) => {
                            //         console.log("swtching to scren sharing")
                            //         const tracks = __localVideo;
                            //         // console.log(tracks);
                            //         const localVideo = getLocalVideoTrack(tracks);
                            //         // console.log(localVideo);
                            //         console.log(desktopStream);
                            //         const _initObj = {
                            //             streamId: desktopStream.id,
                            //             streamReactTag: desktopStream._reactTag,
                            //             tracks: desktopStream._tracks
                            //         }
                            //         console.log(_initObj);
                            //         let initStream = new MediaStream(_initObj)
                            //         console.log(initStream);
                            //         console.log(initStream.getTracks()[0]);
                            //         dispatch(replaceLocalTrack(localVideo.jitsiTrack, initStream.getTracks()[0]));
                            //     });
                            //     this.clicked = true;
                            // } else {
                            //     console.log('already clicked');
                            // }
                             
                        }} 
                    />
                    <LiveStreamButton { ...buttonProps } />
                    <RoomLockButton { ...buttonProps } />
                    <ClosedCaptionButton { ...buttonProps } />
                    <SharedDocumentButton { ...buttonProps } />
                    <HelpButton { ...buttonProps } />
                    {
                        this.props._desktopSharingEnabled
                            && <DesktopSharingButton  { ...buttonProps } />
                    }
                </Collapsible>
            </BottomSheet>
        );
    }


    _renderModeratorButtons: () => React$Element<any>;

    _renderModeratorButtons(buttonProps){
        const { isModerator } = this.state;

        if(isModerator){
            return(
                <MuteEveryoneElseButton { ...buttonProps } />
            );
        }
        return

    }
    _renderMenuExpandToggle: () => React$Element<any>;

    /**
     * Function to render the menu toggle in the bottom sheet header area.
     *
     * @returns {React$Element}
     */
    _renderMenuExpandToggle() {
        return (
            <View
                style = { [
                    this.props._bottomSheetStyles.sheet,
                    styles.expandMenuContainer
                ] }>
                <TouchableOpacity onPress = { this._onToggleMenu }>
                    { /* $FlowFixMeProps */ }
                    <IconDragHandle style = { this.props._bottomSheetStyles.expandIcon } />
                </TouchableOpacity>
            </View>
        );
    }

    _onCancel: () => boolean;

    /**
     * Hides this {@code OverflowMenu}.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        if (this.props._isOpen) {
            this.props.dispatch(hideDialog(OverflowMenu_));

            return true;
        }

        return false;
    }

    _onSwipe: string => void;

    /**
     * Callback to be invoked when swipe gesture is detected on the menu. Returns true
     * if the swipe gesture is handled by the menu, false otherwise.
     *
     * @param {string} direction - Direction of 'up' or 'down'.
     * @returns {boolean}
     */
    _onSwipe(direction) {
        const { showMore } = this.state;

        switch (direction) {
        case 'up':
            !showMore && this.setState({
                showMore: true
            });

            return !showMore;
        case 'down':
            showMore && this.setState({
                showMore: false
            });

            return showMore;
        }
    }

    _onToggleMenu: () => void;

    /**
     * Callback to be invoked when the expand menu button is pressed.
     *
     * @returns {void}
     */
    _onToggleMenu() {
        console.log(this)
        this.setState({
            showMore: !this.state.showMore
        });
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    let { desktopSharingEnabled } = state['features/base/conference'];
    if (state['features/base/config'].enableFeaturesBasedOnToken) {
        // we enable desktop sharing if any participant already have this
        // feature enabled
        desktopSharingEnabled = getParticipants(state)
            .find(({ features = {} }) =>
                String(features['screen-sharing']) === 'true') !== undefined;
    }
    return {
        __localVideo: state['features/base/tracks'],
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _isOpen: isDialogOpen(state, OverflowMenu_),
        _desktopSharingEnabled: Boolean(desktopSharingEnabled)
    };
}

OverflowMenu_ = connect(_mapStateToProps)(OverflowMenu);

export default OverflowMenu_;

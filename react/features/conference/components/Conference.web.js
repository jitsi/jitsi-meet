/* @flow */

import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { Filmstrip } from '../../filmstrip';
import { LargeVideo } from '../../large-video';
import { OverlayContainer } from '../../overlay';
import { Toolbox } from '../../toolbox';
import { HideNotificationBarStyle } from '../../unsupported-browser';

declare var $: Function;
declare var APP: Object;

/**
 * The conference page of the Web application.
 */
class Conference extends Component {

    /**
     * Conference component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: React.PropTypes.func
    };

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        this.props.dispatch(connect());
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.stopDaemons();
        APP.UI.unregisterListeners();
        APP.UI.unbindEvents();

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div id = 'videoconference_page'>
                <div id = 'videospace'>
                    <LargeVideo />

                    <Filmstrip />
                </div>

                <Toolbox />

                <DialogContainer />
                <OverlayContainer />

                {/*
                  * Temasys automatically injects a notification bar, if
                  * necessary, displayed at the top of the page notifying that
                  * WebRTC is not installed or supported. We do not need/want
                  * the notification bar in question because we have whole pages
                  * dedicated to the respective scenarios.
                  */}
                <HideNotificationBarStyle />
            </div>
        );
    }
}

export default reactReduxConnect()(Conference);

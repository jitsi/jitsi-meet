import React from "react";
import { WithTranslation } from "react-i18next";
import { connect as reactReduxConnect } from "react-redux";

// @ts-ignore
import { appNavigate } from "../../../../../app/actions.web";
import { IReduxState } from "../../../../../app/types";
import type { AbstractProps } from "../../../../../conference/components/AbstractConference";
import { AbstractConference, abstractMapStateToProps } from "../../../../../conference/components/AbstractConference";
import Prejoin from "../../../../../prejoin/components/web/Prejoin";
import { translate } from "../../../../i18n/functions";
import { setCreateRoomError } from "../../../general/store/errors/actions";
import MeetingService from "../../../services/meeting.service";
import { setNewMeetingFlowSession } from "../../../services/sessionStorage.service";
import { SET_PREJOIN_PAGE_VISIBILITY } from "../../../../../prejoin/actionTypes";
import { setPrejoinPageVisibility } from "../../../../../prejoin/actions.web";

/**
 * The type of the React {@code Component} props of {@link CreateConference}.
 */
interface IProps extends AbstractProps, WithTranslation {
    dispatch: any;
}

/**
 * The conference page of the Web application.
 */
class CreateConference extends AbstractConference<IProps, any> {
    _onCreateConference = async () => {
        this.props.dispatch(setPrejoinPageVisibility(false));
        this.props.dispatch(setCreateRoomError(false, ""));
        try {
            const meetingData = await MeetingService.instance.createCall();

            if (meetingData?.room) {
                setNewMeetingFlowSession(true);

                // Don't close prejoin - it will close automatically when CONFERENCE_JOIN_IN_PROGRESS fires
                // Closing it here causes loss of device permissions and tracks
                this.props.dispatch(appNavigate(meetingData.room));
            }
        } catch (error: Error | any) {
            this.props.dispatch(setCreateRoomError(true, error.message));
        }
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        return <Prejoin createConference={this._onCreateConference} />;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        ...abstractMapStateToProps(state),
    };
}

export default translate(reactReduxConnect(_mapStateToProps)(CreateConference));

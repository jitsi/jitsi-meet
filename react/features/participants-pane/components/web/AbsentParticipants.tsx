import React from "react";
import { connect } from "react-redux";
import { IReduxState } from "../../../app/types";
import { fetchMeetUsers } from "../../../invite/functions";
import { getSortedParticipantIds } from "../../functions";
import { iAmVisitor } from "../../../visitors/functions";
import AbstractAddPeopleDialog, {
    IProps as AbstractProps,
    IState,
    _mapStateToProps as _abstractMapStateToProps,
} from "../../../../features/invite/components/add-people-dialog/AbstractAddPeopleDialog";
import { getParticipantById } from "../../../base/participants/functions";
import { IInviteSelectItem, IInvitee } from "../../../invite/types";
import { hideAddPeopleDialog } from "../../../invite/actions.any";
import { translate } from "../../../base/i18n/functions";
import { getCurrentRoomId } from "../../../breakout-rooms/functions";
import Collapse from "../../../base/components/collapse/collapse";

interface IProps extends AbstractProps {
    sortedParticipantIds: string[];
    t: Function;
    _currentRoomId: string;
}

interface ILocalState extends IState {
    users: any[];
    loading: boolean;
    callingUserId: string | null;
}

class AbsentParticipants extends AbstractAddPeopleDialog<IProps, ILocalState> {
    override state: ILocalState = {
        addToCallError: false,
        addToCallInProgress: false,
        inviteItems: [] as IInviteSelectItem[],
        loading: false,
        users: [],
        callingUserId: null,
    };
    constructor(props: IProps) {
        super(props);
        this._onInviteClick = this._onInviteClick.bind(this);
    }

    async componentDidMount() {
                const {_jwt,_currentRoomId} = this.props;

        try {
            const users = (await fetchMeetUsers(_jwt ,_currentRoomId)) as any[];
            this.setState({ users, loading: false });
        } catch (err) {
            console.error("Error fetching meet users:", err);
            this.setState({ loading: false });
        }
    }

    _onInviteClick(user: any) {
        this.setState({ callingUserId: user.id });
        setTimeout(() => this.setState({ callingUserId: null }), 5000);

        const invitee = {
            name: user.name,
            id: user.id,
            type: "user",
        };

        this._invite([invitee] as IInvitee[])
            .then((invitesLeftToSend: IInvitee[]) => {
                console.log("invitesLeftToSend", invitesLeftToSend);
            })
            .finally(() => this.props.dispatch(hideAddPeopleDialog()));
    }

    override render() {
        const { users, loading, callingUserId } = this.state;
        const { sortedParticipantIds, t ,_currentRoomId} = this.props;

        const absentParticipants = users.filter((user) => !sortedParticipantIds.includes(user.id));

        return (
            <div style={{ marginBlock: 20 }}>
                <Collapse header={`${t("addPeople.PeopleAddedToMeet")} (${absentParticipants && absentParticipants?.length})`} defaultOpen={true}>
                  {absentParticipants?.length > 0 ? (
                    absentParticipants.map((user) => (
                        <div
                            key={user.id}
                            style={{
                                paddingBlock: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                                flexDirection: "row",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <img
                                    src={
                                        user.avatarURL ||
                                        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                                    }
                                    alt={user.name || user.email}
                                    width={32}
                                    height={32}
                                    style={{ borderRadius: "50%" }}
                                />

                                <p>{user.name || user.email}</p>
                            </div>

                            {callingUserId === user.id ? (
                                <span>{t("prejoin.calling")}</span>
                            ) : (
                                <button className="nx-button transparent" onClick={() => this._onInviteClick(user)}>
                                    {t("addPeople.inviteToMeet")}
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p>همه افراد حاضرند ✅</p>
                )}
                </Collapse>

              
            </div>
        );
    }
}

function _mapStateToProps(state: IReduxState) {
    let sortedParticipantIds: any = getSortedParticipantIds(state);
    const _iAmVisitor = iAmVisitor(state);
        const _currentRoomId = getCurrentRoomId(state);
    
    sortedParticipantIds = sortedParticipantIds.map((id: any) => {
        const participant = getParticipantById(state, id);
        if (_iAmVisitor && participant?.local) {
            return false;
        }
        return participant?.email;
    });

    return {
        sortedParticipantIds,
        _currentRoomId,
        ..._abstractMapStateToProps(state),
    };
}

export default translate(connect(_mapStateToProps)(AbsentParticipants));

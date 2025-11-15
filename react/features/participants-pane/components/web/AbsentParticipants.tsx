import React from "react";
import { connect } from "react-redux";
import { IReduxState } from "../../../app/types";
import { fetchMeetUsers } from "../../../invite/functions";
import { getSortedParticipantIds } from "../../functions";
import { iAmVisitor } from "../../../visitors/functions";
import AbstractAddPeopleDialog, {
    IProps as AbstractProps,
    IState,
    _mapStateToProps as _abstractMapStateToProps
} from "../../../../features/invite/components/add-people-dialog/AbstractAddPeopleDialog";
import { getParticipantById } from "../../../base/participants/functions";

interface IProps extends AbstractProps {
    sortedParticipantIds: string[];
}

interface ILocalState extends IState {
    users: any[];
    loading: boolean;
}

class AbsentParticipants extends AbstractAddPeopleDialog<IProps, ILocalState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            ...this.state, // keep inherited Abstract state
            users: [],
            loading: true
        };

        this._onInviteClick = this._onInviteClick.bind(this);
    }

    async componentDidMount() {
        try {
            const users = await fetchMeetUsers() as any[];
            this.setState({ users, loading: false });
        } catch (err) {
            console.error("Error fetching meet users:", err);
            this.setState({ loading: false });
        }
    }

    _onInviteClick(user: any) {
        console.log("Inviting absent user:", user);
        this._invite([user]) // ✅ inherited from AbstractAddPeopleDialog
            .then(() => console.log("Invite sent"))
            .catch((err: any) => console.error("Invite error", err));
    }

    override render() {
        const { users, loading } = this.state;
        const { sortedParticipantIds } = this.props;

        if (loading) {
            return <p>Loading users...</p>;
        }

        const absentParticipants = users.filter(
            (user) => !sortedParticipantIds.includes(user.id)
        );

        return (
            <div style={{ marginBlock: 20 }}>
                <h3>افراد غایب</h3>

                {absentParticipants?.length > 0 ? (
                    absentParticipants.map((user) => (
                        <div
                            key={user.id}
                            style={{
                                padding: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexDirection: "row",
                            }}
                        >
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
                            <button onClick={() => this._onInviteClick(user)}>
                                Invite
                            </button>
                        </div>
                    ))
                ) : (
                    <p>همه افراد حاضرند ✅</p>
                )}
            </div>
        );
    }
}

function _mapStateToProps(state: IReduxState) {
    let sortedParticipantIds: any = getSortedParticipantIds(state);
    const _iAmVisitor = iAmVisitor(state);

    sortedParticipantIds = sortedParticipantIds.map((id: any) => {
        const participant = getParticipantById(state, id);
        if (_iAmVisitor && participant?.local) {
            return false;
        }
        return participant?.email;
    });

    return {
        sortedParticipantIds,
        ..._abstractMapStateToProps(state),
    };
}

export default connect(_mapStateToProps)(AbsentParticipants);

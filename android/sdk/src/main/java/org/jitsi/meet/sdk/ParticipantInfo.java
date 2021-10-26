package org.jitsi.meet.sdk;

import com.google.gson.annotations.SerializedName;

public class ParticipantInfo {

    @SerializedName("participantId")
    public String id;

    @SerializedName("displayName")
    public String displayName;

    @SerializedName("avatarUrl")
    public String avatarUrl;

    @SerializedName("email")
    public String email;

    @SerializedName("name")
    public String name;

    @SerializedName("isLocal")
    public boolean isLocal;

    @SerializedName("role")
    public String role;
}

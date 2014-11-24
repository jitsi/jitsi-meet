/**
 * Base class for ColibriFocus and JingleSession.
 * @param connection Strophe connection object
 * @param sid my session identifier(resource)
 * @constructor
 */
function SessionBase(connection, sid){

    this.connection = connection;
    this.sid = sid;
}


SessionBase.prototype.modifySources = function (successCallback) {
    var self = this;
    if(this.peerconnection)
        this.peerconnection.modifySources(function(){
            $(document).trigger('setLocalDescription.jingle', [self.sid]);
            if(successCallback) {
                successCallback();
            }
        });
};

SessionBase.prototype.addSource = function (elem, fromJid) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription)
    {
        console.warn("addSource - localDescription not ready yet")
        setTimeout(function()
            {
                self.addSource(elem, fromJid);
            },
            200
        );
        return;
    }

    this.peerconnection.addSource(elem);

    this.modifySources();
};

SessionBase.prototype.removeSource = function (elem, fromJid) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription)
    {
        console.warn("removeSource - localDescription not ready yet")
        setTimeout(function()
            {
                self.removeSource(elem, fromJid);
            },
            200
        );
        return;
    }

    this.peerconnection.removeSource(elem);

    this.modifySources();
};
/**
 * Switches video streams.
 * @param new_stream new stream that will be used as video of this session.
 * @param oldStream old video stream of this session.
 * @param success_callback callback executed after successful stream switch.
 */
SessionBase.prototype.switchStreams = function (new_stream, oldStream, success_callback) {

    var self = this;

    // Stop the stream to trigger onended event for old stream
    oldStream.stop();

    // Remember SDP to figure out added/removed SSRCs
    var oldSdp = null;
    if(self.peerconnection) {
        if(self.peerconnection.localDescription) {
            oldSdp = new SDP(self.peerconnection.localDescription.sdp);
        }
        self.peerconnection.removeStream(oldStream, true);
        self.peerconnection.addStream(new_stream);
    }

    self.connection.jingle.localVideo = new_stream;

    self.connection.jingle.localStreams = [];

    //in firefox we have only one stream object
    if(self.connection.jingle.localAudio != self.connection.jingle.localVideo)
        self.connection.jingle.localStreams.push(self.connection.jingle.localAudio);
    self.connection.jingle.localStreams.push(self.connection.jingle.localVideo);

    // Conference is not active
    if(!oldSdp || !self.peerconnection) {
        success_callback();
        return;
    }

    self.peerconnection.switchstreams = true;
    self.modifySources(function() {
        console.log('modify sources done');

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        console.log("SDPs", oldSdp, newSdp);
        self.notifyMySSRCUpdate(oldSdp, newSdp);

        success_callback();
    });
};

/**
 * Figures out added/removed ssrcs and send update IQs.
 * @param old_sdp SDP object for old description.
 * @param new_sdp SDP object for new description.
 */
SessionBase.prototype.notifyMySSRCUpdate = function (old_sdp, new_sdp) {

    var old_media = old_sdp.getMediaSsrcMap();
    var new_media = new_sdp.getMediaSsrcMap();
    //console.log("old/new medias: ", old_media, new_media);

    var toAdd = old_sdp.getNewMedia(new_sdp);
    var toRemove = new_sdp.getNewMedia(old_sdp);
    //console.log("to add", toAdd);
    //console.log("to remove", toRemove);
    if(Object.keys(toRemove).length > 0){
        this.sendSSRCUpdate(toRemove, null, false);
    }
    if(Object.keys(toAdd).length > 0){
        this.sendSSRCUpdate(toAdd, null, true);
    }
};

/**
 * Empty method that does nothing by default. It should send SSRC update IQs to session participants.
 * @param sdpMediaSsrcs array of
 * @param fromJid
 * @param isAdd
 */
SessionBase.prototype.sendSSRCUpdate = function(sdpMediaSsrcs, fromJid, isAdd) {
    //FIXME: put default implementation here(maybe from JingleSession?)
}

/**
 * Sends SSRC update IQ.
 * @param sdpMediaSsrcs SSRCs map obtained from SDP.getNewMedia. Cntains SSRCs to add/remove.
 * @param sid session identifier that will be put into the IQ.
 * @param initiator initiator identifier.
 * @param toJid destination Jid
 * @param isAdd indicates if this is remove or add operation.
 */
SessionBase.prototype.sendSSRCUpdateIq = function(sdpMediaSsrcs, sid, initiator, toJid, isAdd) {

    var self = this;
    var modify = $iq({to: toJid, type: 'set'})
        .c('jingle', {
            xmlns: 'urn:xmpp:jingle:1',
            action: isAdd ? 'source-add' : 'source-remove',
            initiator: initiator,
            sid: sid
        }
    );
    // FIXME: only announce video ssrcs since we mix audio and dont need
    //      the audio ssrcs therefore
    var modified = false;
    Object.keys(sdpMediaSsrcs).forEach(function(channelNum){
        modified = true;
        var channel = sdpMediaSsrcs[channelNum];
        modify.c('content', {name: channel.mediaType});

        modify.c('description', {xmlns:'urn:xmpp:jingle:apps:rtp:1', media: channel.mediaType});
        // FIXME: not completly sure this operates on blocks and / or handles different ssrcs correctly
        // generate sources from lines
        Object.keys(channel.ssrcs).forEach(function(ssrcNum) {
            var mediaSsrc = channel.ssrcs[ssrcNum];
            modify.c('source', { xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
            modify.attrs({ssrc: mediaSsrc.ssrc});
            // iterate over ssrc lines
            mediaSsrc.lines.forEach(function (line) {
                var idx = line.indexOf(' ');
                var kv = line.substr(idx + 1);
                modify.c('parameter');
                if (kv.indexOf(':') == -1) {
                    modify.attrs({ name: kv });
                } else {
                    modify.attrs({ name: kv.split(':', 2)[0] });
                    modify.attrs({ value: kv.split(':', 2)[1] });
                }
                modify.up(); // end of parameter
            });
            modify.up(); // end of source
        });

        // generate source groups from lines
        channel.ssrcGroups.forEach(function(ssrcGroup) {
            if (ssrcGroup.ssrcs.length != 0) {

                modify.c('ssrc-group', {
                    semantics: ssrcGroup.semantics,
                    xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0'
                });

                ssrcGroup.ssrcs.forEach(function (ssrc) {
                    modify.c('source', { ssrc: ssrc })
                        .up(); // end of source
                });
                modify.up(); // end of ssrc-group
            }
        });

        modify.up(); // end of description
        modify.up(); // end of content
    });
    if (modified) {
        self.connection.sendIQ(modify,
            function (res) {
                console.info('got modify result', res);
            },
            function (err) {
                console.error('got modify error', err);
            }
        );
    } else {
        console.log('modification not necessary');
    }
};

// SDP-based mute by going recvonly/sendrecv
// FIXME: should probably black out the screen as well
SessionBase.prototype.toggleVideoMute = function (callback) {

    var ismuted = false;
    var localVideo = connection.jingle.localVideo;
    for (var idx = 0; idx < localVideo.getVideoTracks().length; idx++) {
        ismuted = !localVideo.getVideoTracks()[idx].enabled;
    }
    for (var idx = 0; idx < localVideo.getVideoTracks().length; idx++) {
        localVideo.getVideoTracks()[idx].enabled = !localVideo.getVideoTracks()[idx].enabled;
    }

    if(this.peerconnection)
        this.peerconnection.hardMuteVideo(!ismuted);
    this.modifySources(callback(!ismuted));
};

var AuthenticationEvents = {
    /**
     * Event callback arguments:
     * function(authenticationEnabled, userIdentity)
     * authenticationEnabled - indicates whether authentication has been enabled
     *                         in this session
     * userIdentity - if user has been logged in then it contains user name. If
     *                contains 'null' or 'undefined' then user is not logged in.
     */
    IDENTITY_UPDATED: "authentication.identity_updated"
};
module.exports = AuthenticationEvents;

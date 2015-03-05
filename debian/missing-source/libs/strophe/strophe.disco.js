/*
  Copyright 2010, François de Metz <francois@2metz.fr>
*/

/**
 * Disco Strophe Plugin
 * Implement http://xmpp.org/extensions/xep-0030.html
 * TODO: manage node hierarchies, and node on info request
 */
Strophe.addConnectionPlugin('disco',
{
    _connection: null,
    _identities : [],
    _features : [],
    _items : [],
    /** Function: init
     * Plugin init
     *
     * Parameters:
     *   (Strophe.Connection) conn - Strophe connection
     */
    init: function(conn)
    {
    this._connection = conn;
        this._identities = [];
        this._features   = [];
        this._items      = [];
        // disco info
        conn.addHandler(this._onDiscoInfo.bind(this), Strophe.NS.DISCO_INFO, 'iq', 'get', null, null);
        // disco items
        conn.addHandler(this._onDiscoItems.bind(this), Strophe.NS.DISCO_ITEMS, 'iq', 'get', null, null);
    },
    /** Function: addIdentity
     * See http://xmpp.org/registrar/disco-categories.html
     * Parameters:
     *   (String) category - category of identity (like client, automation, etc ...)
     *   (String) type - type of identity (like pc, web, bot , etc ...)
     *   (String) name - name of identity in natural language
     *   (String) lang - lang of name parameter
     *
     * Returns:
     *   Boolean
     */
    addIdentity: function(category, type, name, lang)
    {
        for (var i=0; i<this._identities.length; i++)
        {
            if (this._identities[i].category == category &&
                this._identities[i].type == type &&
                this._identities[i].name == name &&
                this._identities[i].lang == lang)
            {
                return false;
            }
        }
        this._identities.push({category: category, type: type, name: name, lang: lang});
        return true;
    },
    /** Function: addFeature
     *
     * Parameters:
     *   (String) var_name - feature name (like jabber:iq:version)
     *
     * Returns:
     *   boolean
     */
    addFeature: function(var_name)
    {
        for (var i=0; i<this._features.length; i++)
        {
             if (this._features[i] == var_name)
                 return false;
        }
        this._features.push(var_name);
        return true;
    },
    /** Function: removeFeature
     *
     * Parameters:
     *   (String) var_name - feature name (like jabber:iq:version)
     *
     * Returns:
     *   boolean
     */
    removeFeature: function(var_name)
    {
        for (var i=0; i<this._features.length; i++)
        {
             if (this._features[i] === var_name){
                 this._features.splice(i,1)
                 return true;
             }
        }
        return false;
    },
    /** Function: addItem
     *
     * Parameters:
     *   (String) jid
     *   (String) name
     *   (String) node
     *   (Function) call_back
     *
     * Returns:
     *   boolean
     */
    addItem: function(jid, name, node, call_back)
    {
        if (node && !call_back)
            return false;
        this._items.push({jid: jid, name: name, node: node, call_back: call_back});
        return true;
    },
    /** Function: info
     * Info query
     *
     * Parameters:
     *   (Function) call_back
     *   (String) jid
     *   (String) node
     */
    info: function(jid, node, success, error, timeout)
    {
        var attrs = {xmlns: Strophe.NS.DISCO_INFO};
        if (node)
            attrs.node = node;

        var info = $iq({from:this._connection.jid,
                         to:jid, type:'get'}).c('query', attrs);
        this._connection.sendIQ(info, success, error, timeout);
    },
    /** Function: items
     * Items query
     *
     * Parameters:
     *   (Function) call_back
     *   (String) jid
     *   (String) node
     */
    items: function(jid, node, success, error, timeout)
    {
        var attrs = {xmlns: Strophe.NS.DISCO_ITEMS};
        if (node)
            attrs.node = node;

        var items = $iq({from:this._connection.jid,
                         to:jid, type:'get'}).c('query', attrs);
        this._connection.sendIQ(items, success, error, timeout);
    },

    /** PrivateFunction: _buildIQResult
     */
    _buildIQResult: function(stanza, query_attrs)
    {
        var id   =  stanza.getAttribute('id');
        var from = stanza.getAttribute('from');
        var iqresult = $iq({type: 'result', id: id});

        if (from !== null) {
            iqresult.attrs({to: from});
        }

        return iqresult.c('query', query_attrs);
    },

    /** PrivateFunction: _onDiscoInfo
     * Called when receive info request
     */
    _onDiscoInfo: function(stanza)
    {
        var node = stanza.getElementsByTagName('query')[0].getAttribute('node');
        var attrs = {xmlns: Strophe.NS.DISCO_INFO};
        if (node)
        {
            attrs.node = node;
        }
        var iqresult = this._buildIQResult(stanza, attrs);
        for (var i=0; i<this._identities.length; i++)
        {
            var attrs = {category: this._identities[i].category,
                         type    : this._identities[i].type};
            if (this._identities[i].name)
                attrs.name = this._identities[i].name;
            if (this._identities[i].lang)
                attrs['xml:lang'] = this._identities[i].lang;
            iqresult.c('identity', attrs).up();
        }
        for (var i=0; i<this._features.length; i++)
        {
            iqresult.c('feature', {'var':this._features[i]}).up();
        }
        this._connection.send(iqresult.tree());
        return true;
    },
    /** PrivateFunction: _onDiscoItems
     * Called when receive items request
     */
    _onDiscoItems: function(stanza)
    {
        var query_attrs = {xmlns: Strophe.NS.DISCO_ITEMS};
        var node = stanza.getElementsByTagName('query')[0].getAttribute('node');
        if (node)
        {
            query_attrs.node = node;
            var items = [];
            for (var i = 0; i < this._items.length; i++)
            {
                if (this._items[i].node == node)
                {
                    items = this._items[i].call_back(stanza);
                    break;
                }
            }
        }
        else
        {
            var items = this._items;
        }
        var iqresult = this._buildIQResult(stanza, query_attrs);
        for (var i = 0; i < items.length; i++)
        {
            var attrs = {jid:  items[i].jid};
            if (items[i].name)
                attrs.name = items[i].name;
            if (items[i].node)
                attrs.node = items[i].node;
            iqresult.c('item', attrs).up();
        }
        this._connection.send(iqresult.tree());
        return true;
    }
});

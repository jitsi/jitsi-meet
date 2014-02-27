/*! strophe.js v1.1.3 - built on 20-01-2014 */
function b64_sha1(a){return binb2b64(core_sha1(str2binb(a),8*a.length))}function str_sha1(a){return binb2str(core_sha1(str2binb(a),8*a.length))}function b64_hmac_sha1(a,b){return binb2b64(core_hmac_sha1(a,b))}function str_hmac_sha1(a,b){return binb2str(core_hmac_sha1(a,b))}function core_sha1(a,b){a[b>>5]|=128<<24-b%32,a[(b+64>>9<<4)+15]=b;var c,d,e,f,g,h,i,j,k=new Array(80),l=1732584193,m=-271733879,n=-1732584194,o=271733878,p=-1009589776;for(c=0;c<a.length;c+=16){for(f=l,g=m,h=n,i=o,j=p,d=0;80>d;d++)k[d]=16>d?a[c+d]:rol(k[d-3]^k[d-8]^k[d-14]^k[d-16],1),e=safe_add(safe_add(rol(l,5),sha1_ft(d,m,n,o)),safe_add(safe_add(p,k[d]),sha1_kt(d))),p=o,o=n,n=rol(m,30),m=l,l=e;l=safe_add(l,f),m=safe_add(m,g),n=safe_add(n,h),o=safe_add(o,i),p=safe_add(p,j)}return[l,m,n,o,p]}function sha1_ft(a,b,c,d){return 20>a?b&c|~b&d:40>a?b^c^d:60>a?b&c|b&d|c&d:b^c^d}function sha1_kt(a){return 20>a?1518500249:40>a?1859775393:60>a?-1894007588:-899497514}function core_hmac_sha1(a,b){var c=str2binb(a);c.length>16&&(c=core_sha1(c,8*a.length));for(var d=new Array(16),e=new Array(16),f=0;16>f;f++)d[f]=909522486^c[f],e[f]=1549556828^c[f];var g=core_sha1(d.concat(str2binb(b)),512+8*b.length);return core_sha1(e.concat(g),672)}function safe_add(a,b){var c=(65535&a)+(65535&b),d=(a>>16)+(b>>16)+(c>>16);return d<<16|65535&c}function rol(a,b){return a<<b|a>>>32-b}function str2binb(a){for(var b=[],c=255,d=0;d<8*a.length;d+=8)b[d>>5]|=(a.charCodeAt(d/8)&c)<<24-d%32;return b}function binb2str(a){for(var b="",c=255,d=0;d<32*a.length;d+=8)b+=String.fromCharCode(a[d>>5]>>>24-d%32&c);return b}function binb2b64(a){for(var b,c,d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",e="",f=0;f<4*a.length;f+=3)for(b=(a[f>>2]>>8*(3-f%4)&255)<<16|(a[f+1>>2]>>8*(3-(f+1)%4)&255)<<8|a[f+2>>2]>>8*(3-(f+2)%4)&255,c=0;4>c;c++)e+=8*f+6*c>32*a.length?"=":d.charAt(b>>6*(3-c)&63);return e}var Base64=function(){var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",b={encode:function(b){var c,d,e,f,g,h,i,j="",k=0;do c=b.charCodeAt(k++),d=b.charCodeAt(k++),e=b.charCodeAt(k++),f=c>>2,g=(3&c)<<4|d>>4,h=(15&d)<<2|e>>6,i=63&e,isNaN(d)?h=i=64:isNaN(e)&&(i=64),j=j+a.charAt(f)+a.charAt(g)+a.charAt(h)+a.charAt(i);while(k<b.length);return j},decode:function(b){var c,d,e,f,g,h,i,j="",k=0;b=b.replace(/[^A-Za-z0-9\+\/\=]/g,"");do f=a.indexOf(b.charAt(k++)),g=a.indexOf(b.charAt(k++)),h=a.indexOf(b.charAt(k++)),i=a.indexOf(b.charAt(k++)),c=f<<2|g>>4,d=(15&g)<<4|h>>2,e=(3&h)<<6|i,j+=String.fromCharCode(c),64!=h&&(j+=String.fromCharCode(d)),64!=i&&(j+=String.fromCharCode(e));while(k<b.length);return j}};return b}(),MD5=function(){var a=function(a,b){var c=(65535&a)+(65535&b),d=(a>>16)+(b>>16)+(c>>16);return d<<16|65535&c},b=function(a,b){return a<<b|a>>>32-b},c=function(a){for(var b=[],c=0;c<8*a.length;c+=8)b[c>>5]|=(255&a.charCodeAt(c/8))<<c%32;return b},d=function(a){for(var b="",c=0;c<32*a.length;c+=8)b+=String.fromCharCode(a[c>>5]>>>c%32&255);return b},e=function(a){for(var b="0123456789abcdef",c="",d=0;d<4*a.length;d++)c+=b.charAt(a[d>>2]>>d%4*8+4&15)+b.charAt(a[d>>2]>>d%4*8&15);return c},f=function(c,d,e,f,g,h){return a(b(a(a(d,c),a(f,h)),g),e)},g=function(a,b,c,d,e,g,h){return f(b&c|~b&d,a,b,e,g,h)},h=function(a,b,c,d,e,g,h){return f(b&d|c&~d,a,b,e,g,h)},i=function(a,b,c,d,e,g,h){return f(b^c^d,a,b,e,g,h)},j=function(a,b,c,d,e,g,h){return f(c^(b|~d),a,b,e,g,h)},k=function(b,c){b[c>>5]|=128<<c%32,b[(c+64>>>9<<4)+14]=c;for(var d,e,f,k,l=1732584193,m=-271733879,n=-1732584194,o=271733878,p=0;p<b.length;p+=16)d=l,e=m,f=n,k=o,l=g(l,m,n,o,b[p+0],7,-680876936),o=g(o,l,m,n,b[p+1],12,-389564586),n=g(n,o,l,m,b[p+2],17,606105819),m=g(m,n,o,l,b[p+3],22,-1044525330),l=g(l,m,n,o,b[p+4],7,-176418897),o=g(o,l,m,n,b[p+5],12,1200080426),n=g(n,o,l,m,b[p+6],17,-1473231341),m=g(m,n,o,l,b[p+7],22,-45705983),l=g(l,m,n,o,b[p+8],7,1770035416),o=g(o,l,m,n,b[p+9],12,-1958414417),n=g(n,o,l,m,b[p+10],17,-42063),m=g(m,n,o,l,b[p+11],22,-1990404162),l=g(l,m,n,o,b[p+12],7,1804603682),o=g(o,l,m,n,b[p+13],12,-40341101),n=g(n,o,l,m,b[p+14],17,-1502002290),m=g(m,n,o,l,b[p+15],22,1236535329),l=h(l,m,n,o,b[p+1],5,-165796510),o=h(o,l,m,n,b[p+6],9,-1069501632),n=h(n,o,l,m,b[p+11],14,643717713),m=h(m,n,o,l,b[p+0],20,-373897302),l=h(l,m,n,o,b[p+5],5,-701558691),o=h(o,l,m,n,b[p+10],9,38016083),n=h(n,o,l,m,b[p+15],14,-660478335),m=h(m,n,o,l,b[p+4],20,-405537848),l=h(l,m,n,o,b[p+9],5,568446438),o=h(o,l,m,n,b[p+14],9,-1019803690),n=h(n,o,l,m,b[p+3],14,-187363961),m=h(m,n,o,l,b[p+8],20,1163531501),l=h(l,m,n,o,b[p+13],5,-1444681467),o=h(o,l,m,n,b[p+2],9,-51403784),n=h(n,o,l,m,b[p+7],14,1735328473),m=h(m,n,o,l,b[p+12],20,-1926607734),l=i(l,m,n,o,b[p+5],4,-378558),o=i(o,l,m,n,b[p+8],11,-2022574463),n=i(n,o,l,m,b[p+11],16,1839030562),m=i(m,n,o,l,b[p+14],23,-35309556),l=i(l,m,n,o,b[p+1],4,-1530992060),o=i(o,l,m,n,b[p+4],11,1272893353),n=i(n,o,l,m,b[p+7],16,-155497632),m=i(m,n,o,l,b[p+10],23,-1094730640),l=i(l,m,n,o,b[p+13],4,681279174),o=i(o,l,m,n,b[p+0],11,-358537222),n=i(n,o,l,m,b[p+3],16,-722521979),m=i(m,n,o,l,b[p+6],23,76029189),l=i(l,m,n,o,b[p+9],4,-640364487),o=i(o,l,m,n,b[p+12],11,-421815835),n=i(n,o,l,m,b[p+15],16,530742520),m=i(m,n,o,l,b[p+2],23,-995338651),l=j(l,m,n,o,b[p+0],6,-198630844),o=j(o,l,m,n,b[p+7],10,1126891415),n=j(n,o,l,m,b[p+14],15,-1416354905),m=j(m,n,o,l,b[p+5],21,-57434055),l=j(l,m,n,o,b[p+12],6,1700485571),o=j(o,l,m,n,b[p+3],10,-1894986606),n=j(n,o,l,m,b[p+10],15,-1051523),m=j(m,n,o,l,b[p+1],21,-2054922799),l=j(l,m,n,o,b[p+8],6,1873313359),o=j(o,l,m,n,b[p+15],10,-30611744),n=j(n,o,l,m,b[p+6],15,-1560198380),m=j(m,n,o,l,b[p+13],21,1309151649),l=j(l,m,n,o,b[p+4],6,-145523070),o=j(o,l,m,n,b[p+11],10,-1120210379),n=j(n,o,l,m,b[p+2],15,718787259),m=j(m,n,o,l,b[p+9],21,-343485551),l=a(l,d),m=a(m,e),n=a(n,f),o=a(o,k);return[l,m,n,o]},l={hexdigest:function(a){return e(k(c(a),8*a.length))},hash:function(a){return d(k(c(a),8*a.length))}};return l}();Function.prototype.bind||(Function.prototype.bind=function(a){var b=this,c=Array.prototype.slice,d=Array.prototype.concat,e=c.call(arguments,1);return function(){return b.apply(a?a:this,d.call(e,c.call(arguments,0)))}}),Array.prototype.indexOf||(Array.prototype.indexOf=function(a){var b=this.length,c=Number(arguments[1])||0;for(c=0>c?Math.ceil(c):Math.floor(c),0>c&&(c+=b);b>c;c++)if(c in this&&this[c]===a)return c;return-1}),function(a){function b(a,b){return new f.Builder(a,b)}function c(a){return new f.Builder("message",a)}function d(a){return new f.Builder("iq",a)}function e(a){return new f.Builder("presence",a)}var f;f={VERSION:"1.1.3",NS:{HTTPBIND:"http://jabber.org/protocol/httpbind",BOSH:"urn:xmpp:xbosh",CLIENT:"jabber:client",AUTH:"jabber:iq:auth",ROSTER:"jabber:iq:roster",PROFILE:"jabber:iq:profile",DISCO_INFO:"http://jabber.org/protocol/disco#info",DISCO_ITEMS:"http://jabber.org/protocol/disco#items",MUC:"http://jabber.org/protocol/muc",SASL:"urn:ietf:params:xml:ns:xmpp-sasl",STREAM:"http://etherx.jabber.org/streams",BIND:"urn:ietf:params:xml:ns:xmpp-bind",SESSION:"urn:ietf:params:xml:ns:xmpp-session",VERSION:"jabber:iq:version",STANZAS:"urn:ietf:params:xml:ns:xmpp-stanzas",XHTML_IM:"http://jabber.org/protocol/xhtml-im",XHTML:"http://www.w3.org/1999/xhtml"},XHTML:{tags:["a","blockquote","br","cite","em","img","li","ol","p","span","strong","ul","body"],attributes:{a:["href"],blockquote:["style"],br:[],cite:["style"],em:[],img:["src","alt","style","height","width"],li:["style"],ol:["style"],p:["style"],span:["style"],strong:[],ul:["style"],body:[]},css:["background-color","color","font-family","font-size","font-style","font-weight","margin-left","margin-right","text-align","text-decoration"],validTag:function(a){for(var b=0;b<f.XHTML.tags.length;b++)if(a==f.XHTML.tags[b])return!0;return!1},validAttribute:function(a,b){if("undefined"!=typeof f.XHTML.attributes[a]&&f.XHTML.attributes[a].length>0)for(var c=0;c<f.XHTML.attributes[a].length;c++)if(b==f.XHTML.attributes[a][c])return!0;return!1},validCSS:function(a){for(var b=0;b<f.XHTML.css.length;b++)if(a==f.XHTML.css[b])return!0;return!1}},Status:{ERROR:0,CONNECTING:1,CONNFAIL:2,AUTHENTICATING:3,AUTHFAIL:4,CONNECTED:5,DISCONNECTED:6,DISCONNECTING:7,ATTACHED:8},LogLevel:{DEBUG:0,INFO:1,WARN:2,ERROR:3,FATAL:4},ElementType:{NORMAL:1,TEXT:3,CDATA:4,FRAGMENT:11},TIMEOUT:1.1,SECONDARY_TIMEOUT:.1,addNamespace:function(a,b){f.NS[a]=b},forEachChild:function(a,b,c){var d,e;for(d=0;d<a.childNodes.length;d++)e=a.childNodes[d],e.nodeType!=f.ElementType.NORMAL||b&&!this.isTagEqual(e,b)||c(e)},isTagEqual:function(a,b){return a.tagName.toLowerCase()==b.toLowerCase()},_xmlGenerator:null,_makeGenerator:function(){var a;return void 0===document.implementation.createDocument||document.implementation.createDocument&&document.documentMode&&document.documentMode<10?(a=this._getIEXmlDom(),a.appendChild(a.createElement("strophe"))):a=document.implementation.createDocument("jabber:client","strophe",null),a},xmlGenerator:function(){return f._xmlGenerator||(f._xmlGenerator=f._makeGenerator()),f._xmlGenerator},_getIEXmlDom:function(){for(var a=null,b=["Msxml2.DOMDocument.6.0","Msxml2.DOMDocument.5.0","Msxml2.DOMDocument.4.0","MSXML2.DOMDocument.3.0","MSXML2.DOMDocument","MSXML.DOMDocument","Microsoft.XMLDOM"],c=0;c<b.length&&null===a;c++)try{a=new ActiveXObject(b[c])}catch(d){a=null}return a},xmlElement:function(a){if(!a)return null;var b,c,d,e=f.xmlGenerator().createElement(a);for(b=1;b<arguments.length;b++)if(arguments[b])if("string"==typeof arguments[b]||"number"==typeof arguments[b])e.appendChild(f.xmlTextNode(arguments[b]));else if("object"==typeof arguments[b]&&"function"==typeof arguments[b].sort)for(c=0;c<arguments[b].length;c++)"object"==typeof arguments[b][c]&&"function"==typeof arguments[b][c].sort&&e.setAttribute(arguments[b][c][0],arguments[b][c][1]);else if("object"==typeof arguments[b])for(d in arguments[b])arguments[b].hasOwnProperty(d)&&e.setAttribute(d,arguments[b][d]);return e},xmlescape:function(a){return a=a.replace(/\&/g,"&amp;"),a=a.replace(/</g,"&lt;"),a=a.replace(/>/g,"&gt;"),a=a.replace(/'/g,"&apos;"),a=a.replace(/"/g,"&quot;")},xmlTextNode:function(a){return f.xmlGenerator().createTextNode(a)},xmlHtmlNode:function(a){var b;if(window.DOMParser){var c=new DOMParser;b=c.parseFromString(a,"text/xml")}else b=new ActiveXObject("Microsoft.XMLDOM"),b.async="false",b.loadXML(a);return b},getText:function(a){if(!a)return null;var b="";0===a.childNodes.length&&a.nodeType==f.ElementType.TEXT&&(b+=a.nodeValue);for(var c=0;c<a.childNodes.length;c++)a.childNodes[c].nodeType==f.ElementType.TEXT&&(b+=a.childNodes[c].nodeValue);return f.xmlescape(b)},copyElement:function(a){var b,c;if(a.nodeType==f.ElementType.NORMAL){for(c=f.xmlElement(a.tagName),b=0;b<a.attributes.length;b++)c.setAttribute(a.attributes[b].nodeName.toLowerCase(),a.attributes[b].value);for(b=0;b<a.childNodes.length;b++)c.appendChild(f.copyElement(a.childNodes[b]))}else a.nodeType==f.ElementType.TEXT&&(c=f.xmlGenerator().createTextNode(a.nodeValue));return c},createHtml:function(a){var b,c,d,e,g,h,i,j,k,l,m;if(a.nodeType==f.ElementType.NORMAL)if(e=a.nodeName.toLowerCase(),f.XHTML.validTag(e))try{for(c=f.xmlElement(e),b=0;b<f.XHTML.attributes[e].length;b++)if(g=f.XHTML.attributes[e][b],h=a.getAttribute(g),"undefined"!=typeof h&&null!==h&&""!==h&&h!==!1&&0!==h)if("style"==g&&"object"==typeof h&&"undefined"!=typeof h.cssText&&(h=h.cssText),"style"==g){for(i=[],j=h.split(";"),d=0;d<j.length;d++)k=j[d].split(":"),l=k[0].replace(/^\s*/,"").replace(/\s*$/,"").toLowerCase(),f.XHTML.validCSS(l)&&(m=k[1].replace(/^\s*/,"").replace(/\s*$/,""),i.push(l+": "+m));i.length>0&&(h=i.join("; "),c.setAttribute(g,h))}else c.setAttribute(g,h);for(b=0;b<a.childNodes.length;b++)c.appendChild(f.createHtml(a.childNodes[b]))}catch(n){c=f.xmlTextNode("")}else for(c=f.xmlGenerator().createDocumentFragment(),b=0;b<a.childNodes.length;b++)c.appendChild(f.createHtml(a.childNodes[b]));else if(a.nodeType==f.ElementType.FRAGMENT)for(c=f.xmlGenerator().createDocumentFragment(),b=0;b<a.childNodes.length;b++)c.appendChild(f.createHtml(a.childNodes[b]));else a.nodeType==f.ElementType.TEXT&&(c=f.xmlTextNode(a.nodeValue));return c},escapeNode:function(a){return a.replace(/^\s+|\s+$/g,"").replace(/\\/g,"\\5c").replace(/ /g,"\\20").replace(/\"/g,"\\22").replace(/\&/g,"\\26").replace(/\'/g,"\\27").replace(/\//g,"\\2f").replace(/:/g,"\\3a").replace(/</g,"\\3c").replace(/>/g,"\\3e").replace(/@/g,"\\40")},unescapeNode:function(a){return a.replace(/\\20/g," ").replace(/\\22/g,'"').replace(/\\26/g,"&").replace(/\\27/g,"'").replace(/\\2f/g,"/").replace(/\\3a/g,":").replace(/\\3c/g,"<").replace(/\\3e/g,">").replace(/\\40/g,"@").replace(/\\5c/g,"\\")},getNodeFromJid:function(a){return a.indexOf("@")<0?null:a.split("@")[0]},getDomainFromJid:function(a){var b=f.getBareJidFromJid(a);if(b.indexOf("@")<0)return b;var c=b.split("@");return c.splice(0,1),c.join("@")},getResourceFromJid:function(a){var b=a.split("/");return b.length<2?null:(b.splice(0,1),b.join("/"))},getBareJidFromJid:function(a){return a?a.split("/")[0]:null},log:function(){},debug:function(a){this.log(this.LogLevel.DEBUG,a)},info:function(a){this.log(this.LogLevel.INFO,a)},warn:function(a){this.log(this.LogLevel.WARN,a)},error:function(a){this.log(this.LogLevel.ERROR,a)},fatal:function(a){this.log(this.LogLevel.FATAL,a)},serialize:function(a){var b;if(!a)return null;"function"==typeof a.tree&&(a=a.tree());var c,d,e=a.nodeName;for(a.getAttribute("_realname")&&(e=a.getAttribute("_realname")),b="<"+e,c=0;c<a.attributes.length;c++)"_realname"!=a.attributes[c].nodeName&&(b+=" "+a.attributes[c].nodeName.toLowerCase()+"='"+a.attributes[c].value.replace(/&/g,"&amp;").replace(/\'/g,"&apos;").replace(/>/g,"&gt;").replace(/</g,"&lt;")+"'");if(a.childNodes.length>0){for(b+=">",c=0;c<a.childNodes.length;c++)switch(d=a.childNodes[c],d.nodeType){case f.ElementType.NORMAL:b+=f.serialize(d);break;case f.ElementType.TEXT:b+=f.xmlescape(d.nodeValue);break;case f.ElementType.CDATA:b+="<![CDATA["+d.nodeValue+"]]>"}b+="</"+e+">"}else b+="/>";return b},_requestId:0,_connectionPlugins:{},addConnectionPlugin:function(a,b){f._connectionPlugins[a]=b}},f.Builder=function(a,b){("presence"==a||"message"==a||"iq"==a)&&(b&&!b.xmlns?b.xmlns=f.NS.CLIENT:b||(b={xmlns:f.NS.CLIENT})),this.nodeTree=f.xmlElement(a,b),this.node=this.nodeTree},f.Builder.prototype={tree:function(){return this.nodeTree},toString:function(){return f.serialize(this.nodeTree)},up:function(){return this.node=this.node.parentNode,this},attrs:function(a){for(var b in a)a.hasOwnProperty(b)&&this.node.setAttribute(b,a[b]);return this},c:function(a,b,c){var d=f.xmlElement(a,b,c);return this.node.appendChild(d),c||(this.node=d),this},cnode:function(a){var b,c=f.xmlGenerator();try{b=void 0!==c.importNode}catch(d){b=!1}var e=b?c.importNode(a,!0):f.copyElement(a);return this.node.appendChild(e),this.node=e,this},t:function(a){var b=f.xmlTextNode(a);return this.node.appendChild(b),this},h:function(a){var b=document.createElement("body");b.innerHTML=a;for(var c=f.createHtml(b);c.childNodes.length>0;)this.node.appendChild(c.childNodes[0]);return this}},f.Handler=function(a,b,c,d,e,g,h){this.handler=a,this.ns=b,this.name=c,this.type=d,this.id=e,this.options=h||{matchBare:!1},this.options.matchBare||(this.options.matchBare=!1),this.from=this.options.matchBare?g?f.getBareJidFromJid(g):null:g,this.user=!0},f.Handler.prototype={isMatch:function(a){var b,c=null;if(c=this.options.matchBare?f.getBareJidFromJid(a.getAttribute("from")):a.getAttribute("from"),b=!1,this.ns){var d=this;f.forEachChild(a,null,function(a){a.getAttribute("xmlns")==d.ns&&(b=!0)}),b=b||a.getAttribute("xmlns")==this.ns}else b=!0;return!b||this.name&&!f.isTagEqual(a,this.name)||this.type&&a.getAttribute("type")!=this.type||this.id&&a.getAttribute("id")!=this.id||this.from&&c!=this.from?!1:!0},run:function(a){var b=null;try{b=this.handler(a)}catch(c){throw c.sourceURL?f.fatal("error: "+this.handler+" "+c.sourceURL+":"+c.line+" - "+c.name+": "+c.message):c.fileName?("undefined"!=typeof console&&(console.trace(),console.error(this.handler," - error - ",c,c.message)),f.fatal("error: "+this.handler+" "+c.fileName+":"+c.lineNumber+" - "+c.name+": "+c.message)):f.fatal("error: "+c.message+"\n"+c.stack),c}return b},toString:function(){return"{Handler: "+this.handler+"("+this.name+","+this.id+","+this.ns+")}"}},f.TimedHandler=function(a,b){this.period=a,this.handler=b,this.lastCalled=(new Date).getTime(),this.user=!0},f.TimedHandler.prototype={run:function(){return this.lastCalled=(new Date).getTime(),this.handler()},reset:function(){this.lastCalled=(new Date).getTime()},toString:function(){return"{TimedHandler: "+this.handler+"("+this.period+")}"}},f.Connection=function(a,b){this.service=a,this.options=b||{};var c=this.options.protocol||"";this._proto=0===a.indexOf("ws:")||0===a.indexOf("wss:")||0===c.indexOf("ws")?new f.Websocket(this):new f.Bosh(this),this.jid="",this.domain=null,this.features=null,this._sasl_data={},this.do_session=!1,this.do_bind=!1,this.timedHandlers=[],this.handlers=[],this.removeTimeds=[],this.removeHandlers=[],this.addTimeds=[],this.addHandlers=[],this._authentication={},this._idleTimeout=null,this._disconnectTimeout=null,this.do_authentication=!0,this.authenticated=!1,this.disconnecting=!1,this.connected=!1,this.errors=0,this.paused=!1,this._data=[],this._uniqueId=0,this._sasl_success_handler=null,this._sasl_failure_handler=null,this._sasl_challenge_handler=null,this.maxRetries=5,this._idleTimeout=setTimeout(this._onIdle.bind(this),100);for(var d in f._connectionPlugins)if(f._connectionPlugins.hasOwnProperty(d)){var e=f._connectionPlugins[d],g=function(){};g.prototype=e,this[d]=new g,this[d].init(this)}},f.Connection.prototype={reset:function(){this._proto._reset(),this.do_session=!1,this.do_bind=!1,this.timedHandlers=[],this.handlers=[],this.removeTimeds=[],this.removeHandlers=[],this.addTimeds=[],this.addHandlers=[],this._authentication={},this.authenticated=!1,this.disconnecting=!1,this.connected=!1,this.errors=0,this._requests=[],this._uniqueId=0},pause:function(){this.paused=!0},resume:function(){this.paused=!1},getUniqueId:function(a){return"string"==typeof a||"number"==typeof a?++this._uniqueId+":"+a:++this._uniqueId+""},connect:function(a,b,c,d,e,g){this.jid=a,this.authzid=f.getBareJidFromJid(this.jid),this.authcid=f.getNodeFromJid(this.jid),this.pass=b,this.servtype="xmpp",this.connect_callback=c,this.disconnecting=!1,this.connected=!1,this.authenticated=!1,this.errors=0,this.domain=f.getDomainFromJid(this.jid),this._changeConnectStatus(f.Status.CONNECTING,null),this._proto._connect(d,e,g)},attach:function(a,b,c,d,e,f,g){this._proto._attach(a,b,c,d,e,f,g)},xmlInput:function(){},xmlOutput:function(){},rawInput:function(){},rawOutput:function(){},send:function(a){if(null!==a){if("function"==typeof a.sort)for(var b=0;b<a.length;b++)this._queueData(a[b]);else"function"==typeof a.tree?this._queueData(a.tree()):this._queueData(a);this._proto._send()}},flush:function(){clearTimeout(this._idleTimeout),this._onIdle()},sendIQ:function(a,b,c,d){var e=null,f=this;"function"==typeof a.tree&&(a=a.tree());var g=a.getAttribute("id");g||(g=this.getUniqueId("sendIQ"),a.setAttribute("id",g));var h=this.addHandler(function(a){e&&f.deleteTimedHandler(e);var d=a.getAttribute("type");if("result"==d)b&&b(a);else{if("error"!=d)throw{name:"StropheError",message:"Got bad IQ type of "+d};c&&c(a)}},null,"iq",null,g);return d&&(e=this.addTimedHandler(d,function(){return f.deleteHandler(h),c&&c(null),!1})),this.send(a),g},_queueData:function(a){if(null===a||!a.tagName||!a.childNodes)throw{name:"StropheError",message:"Cannot queue non-DOMElement."};this._data.push(a)},_sendRestart:function(){this._data.push("restart"),this._proto._sendRestart(),this._idleTimeout=setTimeout(this._onIdle.bind(this),100)},addTimedHandler:function(a,b){var c=new f.TimedHandler(a,b);return this.addTimeds.push(c),c},deleteTimedHandler:function(a){this.removeTimeds.push(a)},addHandler:function(a,b,c,d,e,g,h){var i=new f.Handler(a,b,c,d,e,g,h);return this.addHandlers.push(i),i},deleteHandler:function(a){this.removeHandlers.push(a)},disconnect:function(a){if(this._changeConnectStatus(f.Status.DISCONNECTING,a),f.info("Disconnect was called because: "+a),this.connected){var b=!1;this.disconnecting=!0,this.authenticated&&(b=e({xmlns:f.NS.CLIENT,type:"unavailable"})),this._disconnectTimeout=this._addSysTimedHandler(3e3,this._onDisconnectTimeout.bind(this)),this._proto._disconnect(b)}},_changeConnectStatus:function(a,b){for(var c in f._connectionPlugins)if(f._connectionPlugins.hasOwnProperty(c)){var d=this[c];if(d.statusChanged)try{d.statusChanged(a,b)}catch(e){f.error(""+c+" plugin caused an exception changing status: "+e)}}if(this.connect_callback)try{this.connect_callback(a,b)}catch(g){f.error("User connection callback caused an exception: "+g)}},_doDisconnect:function(){null!==this._disconnectTimeout&&(this.deleteTimedHandler(this._disconnectTimeout),this._disconnectTimeout=null),f.info("_doDisconnect was called"),this._proto._doDisconnect(),this.authenticated=!1,this.disconnecting=!1,this.handlers=[],this.timedHandlers=[],this.removeTimeds=[],this.removeHandlers=[],this.addTimeds=[],this.addHandlers=[],this._changeConnectStatus(f.Status.DISCONNECTED,null),this.connected=!1},_dataRecv:function(a,b){f.info("_dataRecv called");var c=this._proto._reqToData(a);if(null!==c){this.xmlInput!==f.Connection.prototype.xmlInput&&(c.nodeName===this._proto.strip&&c.childNodes.length?this.xmlInput(c.childNodes[0]):this.xmlInput(c)),this.rawInput!==f.Connection.prototype.rawInput&&(b?this.rawInput(b):this.rawInput(f.serialize(c)));for(var d,e;this.removeHandlers.length>0;)e=this.removeHandlers.pop(),d=this.handlers.indexOf(e),d>=0&&this.handlers.splice(d,1);for(;this.addHandlers.length>0;)this.handlers.push(this.addHandlers.pop());if(this.disconnecting&&this._proto._emptyQueue())return this._doDisconnect(),void 0;var g,h,i=c.getAttribute("type");if(null!==i&&"terminate"==i){if(this.disconnecting)return;return g=c.getAttribute("condition"),h=c.getElementsByTagName("conflict"),null!==g?("remote-stream-error"==g&&h.length>0&&(g="conflict"),this._changeConnectStatus(f.Status.CONNFAIL,g)):this._changeConnectStatus(f.Status.CONNFAIL,"unknown"),this.disconnect("unknown stream-error"),void 0}var j=this;f.forEachChild(c,null,function(a){var b,c;for(c=j.handlers,j.handlers=[],b=0;b<c.length;b++){var d=c[b];try{!d.isMatch(a)||!j.authenticated&&d.user?j.handlers.push(d):d.run(a)&&j.handlers.push(d)}catch(e){f.warn("Removing Strophe handlers due to uncaught exception: "+e.message)}}})}},mechanisms:{},_connect_cb:function(a,b,c){f.info("_connect_cb was called"),this.connected=!0;var d=this._proto._reqToData(a);if(d){this.xmlInput!==f.Connection.prototype.xmlInput&&(d.nodeName===this._proto.strip&&d.childNodes.length?this.xmlInput(d.childNodes[0]):this.xmlInput(d)),this.rawInput!==f.Connection.prototype.rawInput&&(c?this.rawInput(c):this.rawInput(f.serialize(d)));var e=this._proto._connect_cb(d);if(e!==f.Status.CONNFAIL){this._authentication.sasl_scram_sha1=!1,this._authentication.sasl_plain=!1,this._authentication.sasl_digest_md5=!1,this._authentication.sasl_anonymous=!1,this._authentication.legacy_auth=!1;var g=d.getElementsByTagName("stream:features").length>0;g||(g=d.getElementsByTagName("features").length>0);var h,i,j=d.getElementsByTagName("mechanism"),k=[],l=!1;if(!g)return this._proto._no_auth_received(b),void 0;if(j.length>0)for(h=0;h<j.length;h++)i=f.getText(j[h]),this.mechanisms[i]&&k.push(this.mechanisms[i]);return this._authentication.legacy_auth=d.getElementsByTagName("auth").length>0,(l=this._authentication.legacy_auth||k.length>0)?(this.do_authentication!==!1&&this.authenticate(k),void 0):(this._proto._no_auth_received(b),void 0)}}},authenticate:function(a){var c;for(c=0;c<a.length-1;++c){for(var e=c,g=c+1;g<a.length;++g)a[g].prototype.priority>a[e].prototype.priority&&(e=g);if(e!=c){var h=a[c];a[c]=a[e],a[e]=h}}var i=!1;for(c=0;c<a.length;++c)if(a[c].test(this)){this._sasl_success_handler=this._addSysHandler(this._sasl_success_cb.bind(this),null,"success",null,null),this._sasl_failure_handler=this._addSysHandler(this._sasl_failure_cb.bind(this),null,"failure",null,null),this._sasl_challenge_handler=this._addSysHandler(this._sasl_challenge_cb.bind(this),null,"challenge",null,null),this._sasl_mechanism=new a[c],this._sasl_mechanism.onStart(this);var j=b("auth",{xmlns:f.NS.SASL,mechanism:this._sasl_mechanism.name});if(this._sasl_mechanism.isClientFirst){var k=this._sasl_mechanism.onChallenge(this,null);j.t(Base64.encode(k))}this.send(j.tree()),i=!0;break}i||(null===f.getNodeFromJid(this.jid)?(this._changeConnectStatus(f.Status.CONNFAIL,"x-strophe-bad-non-anon-jid"),this.disconnect("x-strophe-bad-non-anon-jid")):(this._changeConnectStatus(f.Status.AUTHENTICATING,null),this._addSysHandler(this._auth1_cb.bind(this),null,null,null,"_auth_1"),this.send(d({type:"get",to:this.domain,id:"_auth_1"}).c("query",{xmlns:f.NS.AUTH}).c("username",{}).t(f.getNodeFromJid(this.jid)).tree())))},_sasl_challenge_cb:function(a){var c=Base64.decode(f.getText(a)),d=this._sasl_mechanism.onChallenge(this,c),e=b("response",{xmlns:f.NS.SASL});return""!==d&&e.t(Base64.encode(d)),this.send(e.tree()),!0},_auth1_cb:function(){var a=d({type:"set",id:"_auth_2"}).c("query",{xmlns:f.NS.AUTH}).c("username",{}).t(f.getNodeFromJid(this.jid)).up().c("password").t(this.pass);return f.getResourceFromJid(this.jid)||(this.jid=f.getBareJidFromJid(this.jid)+"/strophe"),a.up().c("resource",{}).t(f.getResourceFromJid(this.jid)),this._addSysHandler(this._auth2_cb.bind(this),null,null,null,"_auth_2"),this.send(a.tree()),!1},_sasl_success_cb:function(a){if(this._sasl_data["server-signature"]){var b,c=Base64.decode(f.getText(a)),d=/([a-z]+)=([^,]+)(,|$)/,e=c.match(d);if("v"==e[1]&&(b=e[2]),b!=this._sasl_data["server-signature"])return this.deleteHandler(this._sasl_failure_handler),this._sasl_failure_handler=null,this._sasl_challenge_handler&&(this.deleteHandler(this._sasl_challenge_handler),this._sasl_challenge_handler=null),this._sasl_data={},this._sasl_failure_cb(null)}return f.info("SASL authentication succeeded."),this._sasl_mechanism&&this._sasl_mechanism.onSuccess(),this.deleteHandler(this._sasl_failure_handler),this._sasl_failure_handler=null,this._sasl_challenge_handler&&(this.deleteHandler(this._sasl_challenge_handler),this._sasl_challenge_handler=null),this._addSysHandler(this._sasl_auth1_cb.bind(this),null,"stream:features",null,null),this._sendRestart(),!1},_sasl_auth1_cb:function(a){this.features=a;var b,c;for(b=0;b<a.childNodes.length;b++)c=a.childNodes[b],"bind"==c.nodeName&&(this.do_bind=!0),"session"==c.nodeName&&(this.do_session=!0);if(!this.do_bind)return this._changeConnectStatus(f.Status.AUTHFAIL,null),!1;this._addSysHandler(this._sasl_bind_cb.bind(this),null,null,null,"_bind_auth_2");var e=f.getResourceFromJid(this.jid);return e?this.send(d({type:"set",id:"_bind_auth_2"}).c("bind",{xmlns:f.NS.BIND}).c("resource",{}).t(e).tree()):this.send(d({type:"set",id:"_bind_auth_2"}).c("bind",{xmlns:f.NS.BIND}).tree()),!1},_sasl_bind_cb:function(a){if("error"==a.getAttribute("type")){f.info("SASL binding failed.");var b,c=a.getElementsByTagName("conflict");return c.length>0&&(b="conflict"),this._changeConnectStatus(f.Status.AUTHFAIL,b),!1}var e,g=a.getElementsByTagName("bind");return g.length>0?(e=g[0].getElementsByTagName("jid"),e.length>0&&(this.jid=f.getText(e[0]),this.do_session?(this._addSysHandler(this._sasl_session_cb.bind(this),null,null,null,"_session_auth_2"),this.send(d({type:"set",id:"_session_auth_2"}).c("session",{xmlns:f.NS.SESSION}).tree())):(this.authenticated=!0,this._changeConnectStatus(f.Status.CONNECTED,null))),void 0):(f.info("SASL binding failed."),this._changeConnectStatus(f.Status.AUTHFAIL,null),!1)},_sasl_session_cb:function(a){if("result"==a.getAttribute("type"))this.authenticated=!0,this._changeConnectStatus(f.Status.CONNECTED,null);else if("error"==a.getAttribute("type"))return f.info("Session creation failed."),this._changeConnectStatus(f.Status.AUTHFAIL,null),!1;return!1},_sasl_failure_cb:function(){return this._sasl_success_handler&&(this.deleteHandler(this._sasl_success_handler),this._sasl_success_handler=null),this._sasl_challenge_handler&&(this.deleteHandler(this._sasl_challenge_handler),this._sasl_challenge_handler=null),this._sasl_mechanism&&this._sasl_mechanism.onFailure(),this._changeConnectStatus(f.Status.AUTHFAIL,null),!1},_auth2_cb:function(a){return"result"==a.getAttribute("type")?(this.authenticated=!0,this._changeConnectStatus(f.Status.CONNECTED,null)):"error"==a.getAttribute("type")&&(this._changeConnectStatus(f.Status.AUTHFAIL,null),this.disconnect("authentication failed")),!1},_addSysTimedHandler:function(a,b){var c=new f.TimedHandler(a,b);return c.user=!1,this.addTimeds.push(c),c},_addSysHandler:function(a,b,c,d,e){var g=new f.Handler(a,b,c,d,e);return g.user=!1,this.addHandlers.push(g),g},_onDisconnectTimeout:function(){return f.info("_onDisconnectTimeout was called"),this._proto._onDisconnectTimeout(),this._doDisconnect(),!1},_onIdle:function(){for(var a,b,c,d;this.addTimeds.length>0;)this.timedHandlers.push(this.addTimeds.pop());for(;this.removeTimeds.length>0;)b=this.removeTimeds.pop(),a=this.timedHandlers.indexOf(b),a>=0&&this.timedHandlers.splice(a,1);var e=(new Date).getTime();for(d=[],a=0;a<this.timedHandlers.length;a++)b=this.timedHandlers[a],(this.authenticated||!b.user)&&(c=b.lastCalled+b.period,0>=c-e?b.run()&&d.push(b):d.push(b));this.timedHandlers=d,clearTimeout(this._idleTimeout),this._proto._onIdle(),this.connected&&(this._idleTimeout=setTimeout(this._onIdle.bind(this),100))}},a&&a(f,b,c,d,e),f.SASLMechanism=function(a,b,c){this.name=a,this.isClientFirst=b,this.priority=c},f.SASLMechanism.prototype={test:function(){return!0},onStart:function(a){this._connection=a},onChallenge:function(){throw new Error("You should implement challenge handling!")},onFailure:function(){this._connection=null},onSuccess:function(){this._connection=null}},f.SASLAnonymous=function(){},f.SASLAnonymous.prototype=new f.SASLMechanism("ANONYMOUS",!1,10),f.SASLAnonymous.test=function(a){return null===a.authcid},f.Connection.prototype.mechanisms[f.SASLAnonymous.prototype.name]=f.SASLAnonymous,f.SASLPlain=function(){},f.SASLPlain.prototype=new f.SASLMechanism("PLAIN",!0,20),f.SASLPlain.test=function(a){return null!==a.authcid},f.SASLPlain.prototype.onChallenge=function(a){var b=a.authzid;return b+="\x00",b+=a.authcid,b+="\x00",b+=a.pass},f.Connection.prototype.mechanisms[f.SASLPlain.prototype.name]=f.SASLPlain,f.SASLSHA1=function(){},f.SASLSHA1.prototype=new f.SASLMechanism("SCRAM-SHA-1",!0,40),f.SASLSHA1.test=function(a){return null!==a.authcid},f.SASLSHA1.prototype.onChallenge=function(a,b,c){var d=c||MD5.hexdigest(1234567890*Math.random()),e="n="+a.authcid;return e+=",r=",e+=d,a._sasl_data.cnonce=d,a._sasl_data["client-first-message-bare"]=e,e="n,,"+e,this.onChallenge=function(a,b){for(var c,d,e,f,g,h,i,j,k,l,m,n="c=biws,",o=a._sasl_data["client-first-message-bare"]+","+b+",",p=a._sasl_data.cnonce,q=/([a-z]+)=([^,]+)(,|$)/;b.match(q);){var r=b.match(q);switch(b=b.replace(r[0],""),r[1]){case"r":c=r[2];break;case"s":d=r[2];break;case"i":e=r[2]}}if(c.substr(0,p.length)!==p)return a._sasl_data={},a._sasl_failure_cb();for(n+="r="+c,o+=n,d=Base64.decode(d),d+="\x00\x00\x00",f=h=core_hmac_sha1(a.pass,d),i=1;e>i;i++){for(g=core_hmac_sha1(a.pass,binb2str(h)),j=0;5>j;j++)f[j]^=g[j];h=g}for(f=binb2str(f),k=core_hmac_sha1(f,"Client Key"),l=str_hmac_sha1(f,"Server Key"),m=core_hmac_sha1(str_sha1(binb2str(k)),o),a._sasl_data["server-signature"]=b64_hmac_sha1(l,o),j=0;5>j;j++)k[j]^=m[j];return n+=",p="+Base64.encode(binb2str(k))}.bind(this),e},f.Connection.prototype.mechanisms[f.SASLSHA1.prototype.name]=f.SASLSHA1,f.SASLMD5=function(){},f.SASLMD5.prototype=new f.SASLMechanism("DIGEST-MD5",!1,30),f.SASLMD5.test=function(a){return null!==a.authcid},f.SASLMD5.prototype._quote=function(a){return'"'+a.replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"'},f.SASLMD5.prototype.onChallenge=function(a,b,c){for(var d,e=/([a-z]+)=("[^"]+"|[^,"]+)(?:,|$)/,f=c||MD5.hexdigest(""+1234567890*Math.random()),g="",h=null,i="",j="";b.match(e);)switch(d=b.match(e),b=b.replace(d[0],""),d[2]=d[2].replace(/^"(.+)"$/,"$1"),d[1]){case"realm":g=d[2];
break;case"nonce":i=d[2];break;case"qop":j=d[2];break;case"host":h=d[2]}var k=a.servtype+"/"+a.domain;null!==h&&(k=k+"/"+h);var l=MD5.hash(a.authcid+":"+g+":"+this._connection.pass)+":"+i+":"+f,m="AUTHENTICATE:"+k,n="";return n+="charset=utf-8,",n+="username="+this._quote(a.authcid)+",",n+="realm="+this._quote(g)+",",n+="nonce="+this._quote(i)+",",n+="nc=00000001,",n+="cnonce="+this._quote(f)+",",n+="digest-uri="+this._quote(k)+",",n+="response="+MD5.hexdigest(MD5.hexdigest(l)+":"+i+":00000001:"+f+":auth:"+MD5.hexdigest(m))+",",n+="qop=auth",this.onChallenge=function(){return""}.bind(this),n},f.Connection.prototype.mechanisms[f.SASLMD5.prototype.name]=f.SASLMD5}(function(){window.Strophe=arguments[0],window.$build=arguments[1],window.$msg=arguments[2],window.$iq=arguments[3],window.$pres=arguments[4]}),Strophe.Request=function(a,b,c,d){this.id=++Strophe._requestId,this.xmlData=a,this.data=Strophe.serialize(a),this.origFunc=b,this.func=b,this.rid=c,this.date=0/0,this.sends=d||0,this.abort=!1,this.dead=null,this.age=function(){if(!this.date)return 0;var a=new Date;return(a-this.date)/1e3},this.timeDead=function(){if(!this.dead)return 0;var a=new Date;return(a-this.dead)/1e3},this.xhr=this._newXHR()},Strophe.Request.prototype={getResponse:function(){var a=null;if(this.xhr.responseXML&&this.xhr.responseXML.documentElement){if(a=this.xhr.responseXML.documentElement,"parsererror"==a.tagName)throw Strophe.error("invalid response received"),Strophe.error("responseText: "+this.xhr.responseText),Strophe.error("responseXML: "+Strophe.serialize(this.xhr.responseXML)),"parsererror"}else this.xhr.responseText&&(Strophe.error("invalid response received"),Strophe.error("responseText: "+this.xhr.responseText),Strophe.error("responseXML: "+Strophe.serialize(this.xhr.responseXML)));return a},_newXHR:function(){var a=null;return window.XMLHttpRequest?(a=new XMLHttpRequest,a.overrideMimeType&&a.overrideMimeType("text/xml")):window.ActiveXObject&&(a=new ActiveXObject("Microsoft.XMLHTTP")),a.onreadystatechange=this.func.bind(null,this),a}},Strophe.Bosh=function(a){this._conn=a,this.rid=Math.floor(4294967295*Math.random()),this.sid=null,this.hold=1,this.wait=60,this.window=5,this._requests=[]},Strophe.Bosh.prototype={strip:null,_buildBody:function(){var a=$build("body",{rid:this.rid++,xmlns:Strophe.NS.HTTPBIND});return null!==this.sid&&a.attrs({sid:this.sid}),a},_reset:function(){this.rid=Math.floor(4294967295*Math.random()),this.sid=null},_connect:function(a,b,c){this.wait=a||this.wait,this.hold=b||this.hold;var d=this._buildBody().attrs({to:this._conn.domain,"xml:lang":"en",wait:this.wait,hold:this.hold,content:"text/xml; charset=utf-8",ver:"1.6","xmpp:version":"1.0","xmlns:xmpp":Strophe.NS.BOSH});c&&d.attrs({route:c});var e=this._conn._connect_cb;this._requests.push(new Strophe.Request(d.tree(),this._onRequestStateChange.bind(this,e.bind(this._conn)),d.tree().getAttribute("rid"))),this._throttledRequestHandler()},_attach:function(a,b,c,d,e,f,g){this._conn.jid=a,this.sid=b,this.rid=c,this._conn.connect_callback=d,this._conn.domain=Strophe.getDomainFromJid(this._conn.jid),this._conn.authenticated=!0,this._conn.connected=!0,this.wait=e||this.wait,this.hold=f||this.hold,this.window=g||this.window,this._conn._changeConnectStatus(Strophe.Status.ATTACHED,null)},_connect_cb:function(a){var b,c,d=a.getAttribute("type");if(null!==d&&"terminate"==d)return Strophe.error("BOSH-Connection failed: "+b),b=a.getAttribute("condition"),c=a.getElementsByTagName("conflict"),null!==b?("remote-stream-error"==b&&c.length>0&&(b="conflict"),this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,b)):this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"unknown"),this._conn._doDisconnect(),Strophe.Status.CONNFAIL;this.sid||(this.sid=a.getAttribute("sid"));var e=a.getAttribute("requests");e&&(this.window=parseInt(e,10));var f=a.getAttribute("hold");f&&(this.hold=parseInt(f,10));var g=a.getAttribute("wait");g&&(this.wait=parseInt(g,10))},_disconnect:function(a){this._sendTerminate(a)},_doDisconnect:function(){this.sid=null,this.rid=Math.floor(4294967295*Math.random())},_emptyQueue:function(){return 0===this._requests.length},_hitError:function(a){this.errors++,Strophe.warn("request errored, status: "+a+", number of errors: "+this.errors),this.errors>4&&this._onDisconnectTimeout()},_no_auth_received:function(a){a=a?a.bind(this._conn):this._conn._connect_cb.bind(this._conn);var b=this._buildBody();this._requests.push(new Strophe.Request(b.tree(),this._onRequestStateChange.bind(this,a.bind(this._conn)),b.tree().getAttribute("rid"))),this._throttledRequestHandler()},_onDisconnectTimeout:function(){for(var a;this._requests.length>0;)a=this._requests.pop(),a.abort=!0,a.xhr.abort(),a.xhr.onreadystatechange=function(){}},_onIdle:function(){var a=this._conn._data;if(this._conn.authenticated&&0===this._requests.length&&0===a.length&&!this._conn.disconnecting&&(Strophe.info("no requests during idle cycle, sending blank request"),a.push(null)),this._requests.length<2&&a.length>0&&!this._conn.paused){for(var b=this._buildBody(),c=0;c<a.length;c++)null!==a[c]&&("restart"===a[c]?b.attrs({to:this._conn.domain,"xml:lang":"en","xmpp:restart":"true","xmlns:xmpp":Strophe.NS.BOSH}):b.cnode(a[c]).up());delete this._conn._data,this._conn._data=[],this._requests.push(new Strophe.Request(b.tree(),this._onRequestStateChange.bind(this,this._conn._dataRecv.bind(this._conn)),b.tree().getAttribute("rid"))),this._processRequest(this._requests.length-1)}if(this._requests.length>0){var d=this._requests[0].age();null!==this._requests[0].dead&&this._requests[0].timeDead()>Math.floor(Strophe.SECONDARY_TIMEOUT*this.wait)&&this._throttledRequestHandler(),d>Math.floor(Strophe.TIMEOUT*this.wait)&&(Strophe.warn("Request "+this._requests[0].id+" timed out, over "+Math.floor(Strophe.TIMEOUT*this.wait)+" seconds since last activity"),this._throttledRequestHandler())}},_onRequestStateChange:function(a,b){if(Strophe.debug("request id "+b.id+"."+b.sends+" state changed to "+b.xhr.readyState),b.abort)return b.abort=!1,void 0;var c;if(4==b.xhr.readyState){c=0;try{c=b.xhr.status}catch(d){}if("undefined"==typeof c&&(c=0),this.disconnecting&&c>=400)return this._hitError(c),void 0;var e=this._requests[0]==b,f=this._requests[1]==b;(c>0&&500>c||b.sends>5)&&(this._removeRequest(b),Strophe.debug("request id "+b.id+" should now be removed")),200==c?((f||e&&this._requests.length>0&&this._requests[0].age()>Math.floor(Strophe.SECONDARY_TIMEOUT*this.wait))&&this._restartRequest(0),Strophe.debug("request id "+b.id+"."+b.sends+" got 200"),a(b),this.errors=0):(Strophe.error("request id "+b.id+"."+b.sends+" error "+c+" happened"),(0===c||c>=400&&600>c||c>=12e3)&&(this._hitError(c),c>=400&&500>c&&(this._conn._changeConnectStatus(Strophe.Status.DISCONNECTING,null),this._conn._doDisconnect()))),c>0&&500>c||b.sends>5||this._throttledRequestHandler()}},_processRequest:function(a){var b=this,c=this._requests[a],d=-1;try{4==c.xhr.readyState&&(d=c.xhr.status)}catch(e){Strophe.error("caught an error in _requests["+a+"], reqStatus: "+d)}if("undefined"==typeof d&&(d=-1),c.sends>this.maxRetries)return this._onDisconnectTimeout(),void 0;var f=c.age(),g=!isNaN(f)&&f>Math.floor(Strophe.TIMEOUT*this.wait),h=null!==c.dead&&c.timeDead()>Math.floor(Strophe.SECONDARY_TIMEOUT*this.wait),i=4==c.xhr.readyState&&(1>d||d>=500);if((g||h||i)&&(h&&Strophe.error("Request "+this._requests[a].id+" timed out (secondary), restarting"),c.abort=!0,c.xhr.abort(),c.xhr.onreadystatechange=function(){},this._requests[a]=new Strophe.Request(c.xmlData,c.origFunc,c.rid,c.sends),c=this._requests[a]),0===c.xhr.readyState){Strophe.debug("request id "+c.id+"."+c.sends+" posting");try{c.xhr.open("POST",this._conn.service,this._conn.options.sync?!1:!0)}catch(j){return Strophe.error("XHR open failed."),this._conn.connected||this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"bad-service"),this._conn.disconnect(),void 0}var k=function(){if(c.date=new Date,b._conn.options.customHeaders){var a=b._conn.options.customHeaders;for(var d in a)a.hasOwnProperty(d)&&c.xhr.setRequestHeader(d,a[d])}c.xhr.send(c.data)};if(c.sends>1){var l=1e3*Math.min(Math.floor(Strophe.TIMEOUT*this.wait),Math.pow(c.sends,3));setTimeout(k,l)}else k();c.sends++,this._conn.xmlOutput!==Strophe.Connection.prototype.xmlOutput&&(c.xmlData.nodeName===this.strip&&c.xmlData.childNodes.length?this._conn.xmlOutput(c.xmlData.childNodes[0]):this._conn.xmlOutput(c.xmlData)),this._conn.rawOutput!==Strophe.Connection.prototype.rawOutput&&this._conn.rawOutput(c.data)}else Strophe.debug("_processRequest: "+(0===a?"first":"second")+" request has readyState of "+c.xhr.readyState)},_removeRequest:function(a){Strophe.debug("removing request");var b;for(b=this._requests.length-1;b>=0;b--)a==this._requests[b]&&this._requests.splice(b,1);a.xhr.onreadystatechange=function(){},this._throttledRequestHandler()},_restartRequest:function(a){var b=this._requests[a];null===b.dead&&(b.dead=new Date),this._processRequest(a)},_reqToData:function(a){try{return a.getResponse()}catch(b){if("parsererror"!=b)throw b;this._conn.disconnect("strophe-parsererror")}},_sendTerminate:function(a){Strophe.info("_sendTerminate was called");var b=this._buildBody().attrs({type:"terminate"});a&&b.cnode(a.tree());var c=new Strophe.Request(b.tree(),this._onRequestStateChange.bind(this,this._conn._dataRecv.bind(this._conn)),b.tree().getAttribute("rid"));this._requests.push(c),this._throttledRequestHandler()},_send:function(){clearTimeout(this._conn._idleTimeout),this._throttledRequestHandler(),this._conn._idleTimeout=setTimeout(this._conn._onIdle.bind(this._conn),100)},_sendRestart:function(){this._throttledRequestHandler(),clearTimeout(this._conn._idleTimeout)},_throttledRequestHandler:function(){this._requests?Strophe.debug("_throttledRequestHandler called with "+this._requests.length+" requests"):Strophe.debug("_throttledRequestHandler called with undefined requests"),this._requests&&0!==this._requests.length&&(this._requests.length>0&&this._processRequest(0),this._requests.length>1&&Math.abs(this._requests[0].rid-this._requests[1].rid)<this.window&&this._processRequest(1))}},Strophe.Websocket=function(a){this._conn=a,this.strip="stream:stream";var b=a.service;if(0!==b.indexOf("ws:")&&0!==b.indexOf("wss:")){var c="";c+="ws"===a.options.protocol&&"https:"!==window.location.protocol?"ws":"wss",c+="://"+window.location.host,c+=0!==b.indexOf("/")?window.location.pathname+b:b,a.service=c}},Strophe.Websocket.prototype={_buildStream:function(){return $build("stream:stream",{to:this._conn.domain,xmlns:Strophe.NS.CLIENT,"xmlns:stream":Strophe.NS.STREAM,version:"1.0"})},_check_streamerror:function(a,b){var c=a.getElementsByTagName("stream:error");if(0===c.length)return!1;for(var d=c[0],e="",f="",g="urn:ietf:params:xml:ns:xmpp-streams",h=0;h<d.childNodes.length;h++){var i=d.childNodes[h];if(i.getAttribute("xmlns")!==g)break;"text"===i.nodeName?f=i.textContent:e=i.nodeName}var j="WebSocket stream error: ";return j+=e?e:"unknown",f&&(j+=" - "+e),Strophe.error(j),this._conn._changeConnectStatus(b,e),this._conn._doDisconnect(),!0},_reset:function(){},_connect:function(){this._closeSocket(),this.socket=new WebSocket(this._conn.service,"xmpp"),this.socket.onopen=this._onOpen.bind(this),this.socket.onerror=this._onError.bind(this),this.socket.onclose=this._onClose.bind(this),this.socket.onmessage=this._connect_cb_wrapper.bind(this)},_connect_cb:function(a){var b=this._check_streamerror(a,Strophe.Status.CONNFAIL);return b?Strophe.Status.CONNFAIL:void 0},_handleStreamStart:function(a){var b=!1,c=a.getAttribute("xmlns");"string"!=typeof c?b="Missing xmlns in stream:stream":c!==Strophe.NS.CLIENT&&(b="Wrong xmlns in stream:stream: "+c);var d=a.namespaceURI;"string"!=typeof d?b="Missing xmlns:stream in stream:stream":d!==Strophe.NS.STREAM&&(b="Wrong xmlns:stream in stream:stream: "+d);var e=a.getAttribute("version");return"string"!=typeof e?b="Missing version in stream:stream":"1.0"!==e&&(b="Wrong version in stream:stream: "+e),b?(this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,b),this._conn._doDisconnect(),!1):!0},_connect_cb_wrapper:function(a){if(0===a.data.indexOf("<stream:stream ")||0===a.data.indexOf("<?xml")){var b=a.data.replace(/^(<\?.*?\?>\s*)*/,"");if(""===b)return;b=a.data.replace(/<stream:stream (.*[^\/])>/,"<stream:stream $1/>");var c=(new DOMParser).parseFromString(b,"text/xml").documentElement;this._conn.xmlInput(c),this._conn.rawInput(a.data),this._handleStreamStart(c)&&(this._connect_cb(c),this.streamStart=a.data.replace(/^<stream:(.*)\/>$/,"<stream:$1>"))}else{if("</stream:stream>"===a.data)return this._conn.rawInput(a.data),this._conn.xmlInput(document.createElement("stream:stream")),this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"Received closing stream"),this._conn._doDisconnect(),void 0;var d=this._streamWrap(a.data),e=(new DOMParser).parseFromString(d,"text/xml").documentElement;this.socket.onmessage=this._onMessage.bind(this),this._conn._connect_cb(e,null,a.data)}},_disconnect:function(a){if(this.socket.readyState!==WebSocket.CLOSED){a&&this._conn.send(a);var b="</stream:stream>";this._conn.xmlOutput(document.createElement("stream:stream")),this._conn.rawOutput(b);try{this.socket.send(b)}catch(c){Strophe.info("Couldn't send closing stream tag.")}}this._conn._doDisconnect()},_doDisconnect:function(){Strophe.info("WebSockets _doDisconnect was called"),this._closeSocket()},_streamWrap:function(a){return this.streamStart+a+"</stream:stream>"},_closeSocket:function(){if(this.socket)try{this.socket.close()}catch(a){}this.socket=null},_emptyQueue:function(){return!0},_onClose:function(){this._conn.connected&&!this._conn.disconnecting?(Strophe.error("Websocket closed unexcectedly"),this._conn._doDisconnect()):Strophe.info("Websocket closed")},_no_auth_received:function(a){Strophe.error("Server did not send any auth methods"),this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"Server did not send any auth methods"),a&&(a=a.bind(this._conn))(),this._conn._doDisconnect()},_onDisconnectTimeout:function(){},_onError:function(a){Strophe.error("Websocket error "+a),this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"The WebSocket connection could not be established was disconnected."),this._disconnect()},_onIdle:function(){var a=this._conn._data;if(a.length>0&&!this._conn.paused){for(var b=0;b<a.length;b++)if(null!==a[b]){var c,d;"restart"===a[b]?(c=this._buildStream(),d=this._removeClosingTag(c),c=c.tree()):(c=a[b],d=Strophe.serialize(c)),this._conn.xmlOutput(c),this._conn.rawOutput(d),this.socket.send(d)}this._conn._data=[]}},_onMessage:function(a){var b,c;if("</stream:stream>"===a.data){var d="</stream:stream>";return this._conn.rawInput(d),this._conn.xmlInput(document.createElement("stream:stream")),this._conn.disconnecting||this._conn._doDisconnect(),void 0}if(0===a.data.search("<stream:stream ")){if(c=a.data.replace(/<stream:stream (.*[^\/])>/,"<stream:stream $1/>"),b=(new DOMParser).parseFromString(c,"text/xml").documentElement,!this._handleStreamStart(b))return}else c=this._streamWrap(a.data),b=(new DOMParser).parseFromString(c,"text/xml").documentElement;if(!this._check_streamerror(b,Strophe.Status.ERROR))return this._conn.disconnecting&&"presence"===b.firstChild.nodeName&&"unavailable"===b.firstChild.getAttribute("type")?(this._conn.xmlInput(b),this._conn.rawInput(Strophe.serialize(b)),void 0):(this._conn._dataRecv(b,a.data),void 0)},_onOpen:function(){Strophe.info("Websocket open");var a=this._buildStream();this._conn.xmlOutput(a.tree());var b=this._removeClosingTag(a);this._conn.rawOutput(b),this.socket.send(b)},_removeClosingTag:function(a){var b=Strophe.serialize(a);return b=b.replace(/<(stream:stream .*[^\/])\/>$/,"<$1>")},_reqToData:function(a){return a},_send:function(){this._conn.flush()},_sendRestart:function(){clearTimeout(this._conn._idleTimeout),this._conn._onIdle.bind(this._conn)()}};Strophe.addConnectionPlugin("disco",{_connection:null,_identities:[],_features:[],_items:[],init:function(a){this._connection=a;this._identities=[];this._features=[];this._items=[];a.addHandler(this._onDiscoInfo.bind(this),Strophe.NS.DISCO_INFO,"iq","get",null,null);a.addHandler(this._onDiscoItems.bind(this),Strophe.NS.DISCO_ITEMS,"iq","get",null,null)},addIdentity:function(d,c,a,e){for(var b=0;b<this._identities.length;b++){if(this._identities[b].category==d&&this._identities[b].type==c&&this._identities[b].name==a&&this._identities[b].lang==e){return false}}this._identities.push({category:d,type:c,name:a,lang:e});return true},addFeature:function(b){for(var a=0;a<this._features.length;a++){if(this._features[a]==b){return false}}this._features.push(b);return true},removeFeature:function(b){for(var a=0;a<this._features.length;a++){if(this._features[a]===b){this._features.splice(a,1);return true}}return false},addItem:function(b,a,c,d){if(c&&!d){return false}this._items.push({jid:b,name:a,node:c,call_back:d});return true},info:function(c,d,g,b,e){var a={xmlns:Strophe.NS.DISCO_INFO};if(d){a.node=d}var f=$iq({from:this._connection.jid,to:c,type:"get"}).c("query",a);this._connection.sendIQ(f,g,b,e)},items:function(d,e,g,c,f){var b={xmlns:Strophe.NS.DISCO_ITEMS};if(e){b.node=e}var a=$iq({from:this._connection.jid,to:d,type:"get"}).c("query",b);this._connection.sendIQ(a,g,c,f)},_buildIQResult:function(c,b){var e=c.getAttribute("id");var d=c.getAttribute("from");var a=$iq({type:"result",id:e});if(d!==null){a.attrs({to:d})}return a.c("query",b)},_onDiscoInfo:function(e){var d=e.getElementsByTagName("query")[0].getAttribute("node");var a={xmlns:Strophe.NS.DISCO_INFO};if(d){a.node=d}var c=this._buildIQResult(e,a);for(var b=0;b<this._identities.length;b++){var a={category:this._identities[b].category,type:this._identities[b].type};if(this._identities[b].name){a.name=this._identities[b].name}if(this._identities[b].lang){a["xml:lang"]=this._identities[b].lang}c.c("identity",a).up()}for(var b=0;b<this._features.length;b++){c.c("feature",{"var":this._features[b]}).up()}this._connection.send(c.tree());return true},_onDiscoItems:function(g){var f={xmlns:Strophe.NS.DISCO_ITEMS};var e=g.getElementsByTagName("query")[0].getAttribute("node");if(e){f.node=e;var a=[];for(var c=0;c<this._items.length;c++){if(this._items[c].node==e){a=this._items[c].call_back(g);break}}}else{var a=this._items}var d=this._buildIQResult(g,f);for(var c=0;c<a.length;c++){var b={jid:a[c].jid};if(a[c].name){b.name=a[c].name}if(a[c].node){b.node=a[c].node}d.c("item",b).up()}this._connection.send(d.tree());return true}});/* jshint -W117 */
function TraceablePeerConnection(ice_config, constraints) {
    var self = this;
    var RTCPeerconnection = navigator.mozGetUserMedia ? mozRTCPeerConnection : webkitRTCPeerConnection;
    this.peerconnection = new RTCPeerconnection(ice_config, constraints);
    this.updateLog = [];
    this.stats = {};
    this.statsinterval = null;
    this.maxstats = 300; // limit to 300 values, i.e. 5 minutes; set to 0 to disable

    // override as desired
    this.trace = function(what, info) {
        //console.warn('WTRACE', what, info);
        self.updateLog.push({
            time: new Date(),
            type: what,
            value: info || ""
        });
    };
    this.onicecandidate = null;
    this.peerconnection.onicecandidate = function (event) {
        self.trace('onicecandidate', JSON.stringify(event.candidate, null, ' '));
        if (self.onicecandidate !== null) {
            self.onicecandidate(event);
        }
    };
    this.onaddstream = null;
    this.peerconnection.onaddstream = function (event) {
        self.trace('onaddstream', event.stream.id);
        if (self.onaddstream !== null) {
            self.onaddstream(event);
        }
    };
    this.onremovestream = null;
    this.peerconnection.onremovestream = function (event) {
        self.trace('onremovestream', event.stream.id);
        if (self.onremovestream !== null) {
            self.onremovestream(event);
        }
    };
    this.onsignalingstatechange = null;
    this.peerconnection.onsignalingstatechange = function (event) {
        self.trace('onsignalingstatechange', event.srcElement.signalingState);
        if (self.onsignalingstatechange !== null) {
            self.onsignalingstatechange(event);
        }
    };
    this.oniceconnectionstatechange = null;
    this.peerconnection.oniceconnectionstatechange = function (event) {
        self.trace('oniceconnectionstatechange', event.srcElement.iceConnectionState);
        if (self.oniceconnectionstatechange !== null) {
            self.oniceconnectionstatechange(event);
        }
    };
    this.onnegotiationneeded = null;
    this.peerconnection.onnegotiationneeded = function (event) {
        self.trace('onnegotiationneeded');
        if (self.onnegotiationneeded !== null) {
            self.onnegotiationneeded(event);
        }
    };
    self.ondatachannel = null;
    this.peerconnection.ondatachannel = function (event) {
        self.trace('ondatachannel', event);
        if (self.ondatachannel !== null) {
            self.ondatachannel(event);
        }
    }
    if (!navigator.mozGetUserMedia) {
        this.statsinterval = window.setInterval(function() {
            self.peerconnection.getStats(function(stats) {
                var results = stats.result();
                for (var i = 0; i < results.length; ++i) {
                    //console.log(results[i].type, results[i].id, results[i].names())
                    var now = new Date();
                    results[i].names().forEach(function (name) {
                        var id = results[i].id + '-' + name;
                        if (!self.stats[id]) {
                            self.stats[id] = {
                                startTime: now,
                                endTime: now,
                                values: [],
                                times: []
                            };
                        }
                        self.stats[id].values.push(results[i].stat(name));
                        self.stats[id].times.push(now.getTime());
                        if (self.stats[id].values.length > self.maxstats) {
                            self.stats[id].values.shift();
                            self.stats[id].times.shift();
                        }
                        self.stats[id].endTime = now;
                    });
                }
            });

        }, 1000);
    }
};

dumpSDP = function(description) {
    return 'type: ' + description.type + '\r\n' + description.sdp;
}

if (TraceablePeerConnection.prototype.__defineGetter__ !== undefined) {
    TraceablePeerConnection.prototype.__defineGetter__('signalingState', function() { return this.peerconnection.signalingState; });
    TraceablePeerConnection.prototype.__defineGetter__('iceConnectionState', function() { return this.peerconnection.iceConnectionState; });
    TraceablePeerConnection.prototype.__defineGetter__('localDescription', function() { return this.peerconnection.localDescription; });
    TraceablePeerConnection.prototype.__defineGetter__('remoteDescription', function() { return this.peerconnection.remoteDescription; });
}

TraceablePeerConnection.prototype.addStream = function (stream) {
    this.trace('addStream', stream.id);
    this.peerconnection.addStream(stream);
};

TraceablePeerConnection.prototype.removeStream = function (stream) {
    this.trace('removeStream', stream.id);
    this.peerconnection.removeStream(stream);
};

TraceablePeerConnection.prototype.createDataChannel = function (label, opts) {
    this.trace('createDataChannel', label, opts);
    this.peerconnection.createDataChannel(label, opts);
}

TraceablePeerConnection.prototype.setLocalDescription = function (description, successCallback, failureCallback) {
    var self = this;
    this.trace('setLocalDescription', dumpSDP(description));
    this.peerconnection.setLocalDescription(description, 
        function () {
            self.trace('setLocalDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setLocalDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
    if (this.statsinterval === null && this.maxstats > 0) {
        // start gathering stats
    }
    */
};

TraceablePeerConnection.prototype.setRemoteDescription = function (description, successCallback, failureCallback) {
    var self = this;
    this.trace('setRemoteDescription', dumpSDP(description));
    this.peerconnection.setRemoteDescription(description, 
        function () {
            self.trace('setRemoteDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setRemoteDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
    if (this.statsinterval === null && this.maxstats > 0) {
        // start gathering stats
    }
    */
};

TraceablePeerConnection.prototype.close = function () {
    this.trace('stop');
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
    this.peerconnection.close();
};

TraceablePeerConnection.prototype.createOffer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createOffer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createOffer(
        function (offer) {
            self.trace('createOfferOnSuccess', dumpSDP(offer));
            successCallback(offer);
        },
        function(err) {
            self.trace('createOfferOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.createAnswer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createAnswer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createAnswer(
        function (answer) {
            self.trace('createAnswerOnSuccess', dumpSDP(answer));
            successCallback(answer);
        },
        function(err) {
            self.trace('createAnswerOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.addIceCandidate = function (candidate, successCallback, failureCallback) {
    var self = this;
    this.trace('addIceCandidate', JSON.stringify(candidate, null, ' '));
    this.peerconnection.addIceCandidate(candidate);
    /* maybe later
    this.peerconnection.addIceCandidate(candidate, 
        function () {                                
            self.trace('addIceCandidateOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('addIceCandidateOnFailure', err);
            failureCallback(err);
        }
    );
    */
};

TraceablePeerConnection.prototype.getStats = function(callback, errback) {
    if (navigator.mozGetUserMedia) {
        // ignore for now...
    } else {
        this.peerconnection.getStats(callback);
    }
};

// mozilla chrome compat layer -- very similar to adapter.js
function setupRTC() {
    var RTC = null;
    if (navigator.mozGetUserMedia) {
        console.log('This appears to be Firefox');
        var version = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
        if (version >= 22) {
            RTC = {
                peerconnection: mozRTCPeerConnection,
                browser: 'firefox',
                getUserMedia: navigator.mozGetUserMedia.bind(navigator),
                attachMediaStream: function (element, stream) {
                    element[0].mozSrcObject = stream;
                    element[0].play();
                },
                pc_constraints: {}
            };
            if (!MediaStream.prototype.getVideoTracks)
                MediaStream.prototype.getVideoTracks = function () { return []; };
            if (!MediaStream.prototype.getAudioTracks)
                MediaStream.prototype.getAudioTracks = function () { return []; };
            RTCSessionDescription = mozRTCSessionDescription;
            RTCIceCandidate = mozRTCIceCandidate;
        }
    } else if (navigator.webkitGetUserMedia) {
        console.log('This appears to be Chrome');
        RTC = {
            peerconnection: webkitRTCPeerConnection,
            browser: 'chrome',
            getUserMedia: navigator.webkitGetUserMedia.bind(navigator),
            attachMediaStream: function (element, stream) {
                element.attr('src', webkitURL.createObjectURL(stream));
            },
            // DTLS should now be enabled by default but..
            pc_constraints: {'optional': [{'DtlsSrtpKeyAgreement': 'true'}]} 
        };
        if (navigator.userAgent.indexOf('Android') != -1) {
            RTC.pc_constraints = {}; // disable DTLS on Android
        }
        if (!webkitMediaStream.prototype.getVideoTracks) {
            webkitMediaStream.prototype.getVideoTracks = function () {
                return this.videoTracks;
            };
        }
        if (!webkitMediaStream.prototype.getAudioTracks) {
            webkitMediaStream.prototype.getAudioTracks = function () {
                return this.audioTracks;
            };
        }
    }
    if (RTC === null) {
        try { console.log('Browser does not appear to be WebRTC-capable'); } catch (e) { }
    }
    return RTC;
}

function getUserMediaWithConstraints(um, resolution, bandwidth, fps) {
    var constraints = {audio: false, video: false};

    if (um.indexOf('video') >= 0) {
        constraints.video = {mandatory: {}};// same behaviour as true
    }
    if (um.indexOf('audio') >= 0) {
        constraints.audio = {};// same behaviour as true
    }
    if (um.indexOf('screen') >= 0) {
        constraints.video = {
            "mandatory": {
                "chromeMediaSource": "screen"
            }
        };
    }

    if (resolution && !constraints.video) {
        constraints.video = {mandatory: {}};// same behaviour as true
    }
    // see https://code.google.com/p/chromium/issues/detail?id=143631#c9 for list of supported resolutions
    switch (resolution) {
    // 16:9 first
    case '1080':
    case 'fullhd':
        constraints.video.mandatory.minWidth = 1920;
        constraints.video.mandatory.minHeight = 1080;
        constraints.video.mandatory.minAspectRatio = 1.77;
        break;
    case '720':
    case 'hd':
        constraints.video.mandatory.minWidth = 1280;
        constraints.video.mandatory.minHeight = 720;
        constraints.video.mandatory.minAspectRatio = 1.77;
        break;
    case '360':
        constraints.video.mandatory.minWidth = 640;
        constraints.video.mandatory.minHeight = 360;
        constraints.video.mandatory.minAspectRatio = 1.77;
        break;
    case '180':
        constraints.video.mandatory.minWidth = 320;
        constraints.video.mandatory.minHeight = 180;
        constraints.video.mandatory.minAspectRatio = 1.77;
        break;
        // 4:3
    case '960':
        constraints.video.mandatory.minWidth = 960;
        constraints.video.mandatory.minHeight = 720;
        break;
    case '640':
    case 'vga':
        constraints.video.mandatory.minWidth = 640;
        constraints.video.mandatory.minHeight = 480;
        break;
    case '320':
        constraints.video.mandatory.minWidth = 320;
        constraints.video.mandatory.minHeight = 240;
        break;
    default:
        if (navigator.userAgent.indexOf('Android') != -1) {
            constraints.video.mandatory.minWidth = 320;
            constraints.video.mandatory.minHeight = 240;
            constraints.video.mandatory.maxFrameRate = 15;
        }
        break;
    }

    if (bandwidth) { // doesn't work currently, see webrtc issue 1846
        if (!constraints.video) constraints.video = {mandatory: {}};//same behaviour as true
        constraints.video.optional = [{bandwidth: bandwidth}];
    }
    if (fps) { // for some cameras it might be necessary to request 30fps
        // so they choose 30fps mjpg over 10fps yuy2
        if (!constraints.video) constraints.video = {mandatory: {}};// same behaviour as tru;
        constraints.video.mandatory.minFrameRate = fps;
    }
 
    try {
        RTC.getUserMedia(constraints,
                function (stream) {
                    console.log('onUserMediaSuccess');
                    $(document).trigger('mediaready.jingle', [stream]);
                },
                function (error) {
                    console.warn('Failed to get access to local media. Error ', error);
                    $(document).trigger('mediafailure.jingle');
                });
    } catch (e) {
        console.error('GUM failed: ', e);
        $(document).trigger('mediafailure.jingle');
    }
}
/* jshint -W117 */
Strophe.addConnectionPlugin('jingle', {
    connection: null,
    sessions: {},
    jid2session: {},
    ice_config: {iceServers: []},
    pc_constraints: {},
    media_constraints: {
        mandatory: {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }
        // MozDontOfferDataChannel: true when this is firefox
    },
    localStream: null,

    init: function (conn) {
        this.connection = conn;
        if (this.connection.disco) {
            // http://xmpp.org/extensions/xep-0167.html#support
            // http://xmpp.org/extensions/xep-0176.html#support
            this.connection.disco.addFeature('urn:xmpp:jingle:1');
            this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:1');
            this.connection.disco.addFeature('urn:xmpp:jingle:transports:ice-udp:1');
            this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:audio');
            this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:video');


            // this is dealt with by SDP O/A so we don't need to annouce this
            //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtcp-fb:0'); // XEP-0293
            //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtp-hdrext:0'); // XEP-0294
            this.connection.disco.addFeature('urn:ietf:rfc:5761'); // rtcp-mux
            //this.connection.disco.addFeature('urn:ietf:rfc:5888'); // a=group, e.g. bundle
            //this.connection.disco.addFeature('urn:ietf:rfc:5576'); // a=ssrc
        }
        this.connection.addHandler(this.onJingle.bind(this), 'urn:xmpp:jingle:1', 'iq', 'set', null, null);
    },
    onJingle: function (iq) {
        var sid = $(iq).find('jingle').attr('sid');
        var action = $(iq).find('jingle').attr('action');
        // send ack first
        var ack = $iq({type: 'result',
              to: iq.getAttribute('from'),
              id: iq.getAttribute('id')
        });
        console.log('on jingle ' + action);
        var sess = this.sessions[sid];
        if ('session-initiate' != action) {
            if (sess === null) {
                ack.type = 'error';
                ack.c('error', {type: 'cancel'})
                   .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                   .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                this.connection.send(ack);
                return true;
            }
            // compare from to sess.peerjid (bare jid comparison for later compat with message-mode)
            // local jid is not checked
            if (Strophe.getBareJidFromJid(iq.getAttribute('from')) != Strophe.getBareJidFromJid(sess.peerjid)) {
                console.warn('jid mismatch for session id', sid, iq.getAttribute('from'), sess.peerjid);
                ack.type = 'error';
                ack.c('error', {type: 'cancel'})
                   .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                   .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                this.connection.send(ack);
                return true;
            }
        } else if (sess !== undefined) {
            // existing session with same session id
            // this might be out-of-order if the sess.peerjid is the same as from
            ack.type = 'error';
            ack.c('error', {type: 'cancel'})
               .c('service-unavailable', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up();
            console.warn('duplicate session id', sid);
            this.connection.send(ack);
            return true;
        }
        // FIXME: check for a defined action
        this.connection.send(ack);
        // see http://xmpp.org/extensions/xep-0166.html#concepts-session
        switch (action) {
        case 'session-initiate':
            sess = new JingleSession($(iq).attr('to'), $(iq).find('jingle').attr('sid'), this.connection);
            // configure session
            if (this.localStream) {
                sess.localStreams.push(this.localStream);
            }
            sess.media_constraints = this.media_constraints;
            sess.pc_constraints = this.pc_constraints;
            sess.ice_config = this.ice_config;

            sess.initiate($(iq).attr('from'), false);
            // FIXME: setRemoteDescription should only be done when this call is to be accepted
            sess.setRemoteDescription($(iq).find('>jingle'), 'offer');

            this.sessions[sess.sid] = sess;
            this.jid2session[sess.peerjid] = sess;

            // the callback should either 
            // .sendAnswer and .accept
            // or .sendTerminate -- not necessarily synchronus
            $(document).trigger('callincoming.jingle', [sess.sid]);
            break;
        case 'session-accept':
            sess.setRemoteDescription($(iq).find('>jingle'), 'answer');
            sess.accept();
            $(document).trigger('callaccepted.jingle', [sess.sid]);
            break;
        case 'session-terminate':
            console.log('terminating...');
            sess.terminate();
            this.terminate(sess.sid);
            if ($(iq).find('>jingle>reason').length) {
                $(document).trigger('callterminated.jingle', [
                    sess.sid,
                    $(iq).find('>jingle>reason>:first')[0].tagName,
                    $(iq).find('>jingle>reason>text').text()
                ]);
            } else {
                $(document).trigger('callterminated.jingle', [sess.sid]);
            }
            break;
        case 'transport-info':
            sess.addIceCandidate($(iq).find('>jingle>content'));
            break;
        case 'session-info':
            var affected;
            if ($(iq).find('>jingle>ringing[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                $(document).trigger('ringing.jingle', [sess.sid]);
            } else if ($(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                affected = $(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                $(document).trigger('mute.jingle', [sess.sid, affected]);
            } else if ($(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                affected = $(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                $(document).trigger('unmute.jingle', [sess.sid, affected]);
            }
            break;
        case 'addsource': // FIXME: proprietary
            sess.addSource($(iq).find('>jingle>content'));
            break;
        case 'removesource': // FIXME: proprietary
            sess.removeSource($(iq).find('>jingle>content'));
            break;
        default:
            console.warn('jingle action not implemented', action);
            break;
        }
        return true;
    },
    initiate: function (peerjid, myjid) { // initiate a new jinglesession to peerjid
        var sess = new JingleSession(myjid || this.connection.jid,
                                     Math.random().toString(36).substr(2, 12), // random string
                                     this.connection);
        // configure session
        if (this.localStream) {
            sess.localStreams.push(this.localStream);
        }
        sess.media_constraints = this.media_constraints;
        sess.pc_constraints = this.pc_constraints;
        sess.ice_config = this.ice_config;

        sess.initiate(peerjid, true);
        this.sessions[sess.sid] = sess;
        this.jid2session[sess.peerjid] = sess;
        sess.sendOffer();
        return sess;
    },
    terminate: function (sid, reason, text) { // terminate by sessionid (or all sessions)
        if (sid === null || sid === undefined) {
            for (sid in this.sessions) {
                if (this.sessions[sid].state != 'ended') {
                    this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                    this.sessions[sid].terminate();
                }
                delete this.jid2session[this.sessions[sid].peerjid];
                delete this.sessions[sid];
            }
        } else if (this.sessions.hasOwnProperty(sid)) {
            if (this.sessions[sid].state != 'ended') {
                this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                this.sessions[sid].terminate();
            }
            delete this.jid2session[this.sessions[sid].peerjid];
            delete this.sessions[sid];
        }
    },
    terminateByJid: function (jid) {
        if (this.jid2session.hasOwnProperty(jid)) {
            var sess = this.jid2session[jid];
            if (sess) {
                sess.terminate();
                console.log('peer went away silently', jid);
                delete this.sessions[sess.sid];
                delete this.jid2session[jid];
                $(document).trigger('callterminated.jingle', [sess.sid, 'gone']);
            }
        }
    },
    getStunAndTurnCredentials: function () {
        // get stun and turn configuration from server via xep-0215
        // uses time-limited credentials as described in
        // http://tools.ietf.org/html/draft-uberti-behave-turn-rest-00
        //
        // see https://code.google.com/p/prosody-modules/source/browse/mod_turncredentials/mod_turncredentials.lua
        // for a prosody module which implements this
        //
        // currently, this doesn't work with updateIce and therefore credentials with a long
        // validity have to be fetched before creating the peerconnection
        // TODO: implement refresh via updateIce as described in
        //      https://code.google.com/p/webrtc/issues/detail?id=1650
        var self = this;
        this.connection.sendIQ(
            $iq({type: 'get', to: this.connection.domain})
                .c('services', {xmlns: 'urn:xmpp:extdisco:1'}).c('service', {host: 'turn.' + this.connection.domain}),
            function (res) {
                var iceservers = [];
                $(res).find('>services>service').each(function (idx, el) {
                    el = $(el);
                    var dict = {};
                    switch (el.attr('type')) {
                    case 'stun':
                        dict.url = 'stun:' + el.attr('host');
                        if (el.attr('port')) {
                            dict.url += ':' + el.attr('port');
                        }
                        iceservers.push(dict);
                        break;
                    case 'turn':
                        dict.url = 'turn:';
                        if (el.attr('username')) { // https://code.google.com/p/webrtc/issues/detail?id=1508
                            if (navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) && parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10) < 28) {
                                dict.url += el.attr('username') + '@';
                            } else {
                                dict.username = el.attr('username'); // only works in M28
                            }
                        }
                        dict.url += el.attr('host');
                        if (el.attr('port') && el.attr('port') != '3478') {
                            dict.url += ':' + el.attr('port');
                        }
                        if (el.attr('transport') && el.attr('transport') != 'udp') {
                            dict.url += '?transport=' + el.attr('transport');
                        }
                        if (el.attr('password')) {
                            dict.credential = el.attr('password');
                        }
                        iceservers.push(dict);
                        break;
                    }
                });
                self.ice_config.iceServers = iceservers;
            },
            function (err) {
                console.warn('getting turn credentials failed', err);
                console.warn('is mod_turncredentials or similar installed?');
            }
        );
        // implement push?
    }
});
/* jshint -W117 */
// SDP STUFF
function SDP(sdp) {
    this.media = sdp.split('\r\nm=');
    for (var i = 1; i < this.media.length; i++) {
        this.media[i] = 'm=' + this.media[i];
        if (i != this.media.length - 1) {
            this.media[i] += '\r\n';
        }
    }
    this.session = this.media.shift() + '\r\n';
    this.raw = this.session + this.media.join('');
}

// remove iSAC and CN from SDP
SDP.prototype.mangle = function () {
    var i, j, mline, lines, rtpmap, newdesc;
    for (i = 0; i < this.media.length; i++) {
        lines = this.media[i].split('\r\n');
        lines.pop(); // remove empty last element
        mline = SDPUtil.parse_mline(lines.shift());
        if (mline.media != 'audio')
            continue;
        newdesc = '';
        mline.fmt.length = 0;
        for (j = 0; j < lines.length; j++) {
            if (lines[j].substr(0, 9) == 'a=rtpmap:') {
                rtpmap = SDPUtil.parse_rtpmap(lines[j]);
                if (rtpmap.name == 'CN' || rtpmap.name == 'ISAC')
                    continue;
                mline.fmt.push(rtpmap.id);
                newdesc += lines[j] + '\r\n';
            } else {
                newdesc += lines[j] + '\r\n';
            }
        }
        this.media[i] = SDPUtil.build_mline(mline) + '\r\n';
        this.media[i] += newdesc;
    }
    this.raw = this.session + this.media.join('');
};

// remove lines matching prefix from session section
SDP.prototype.removeSessionLines = function(prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.session, prefix);
    lines.forEach(function(line) {
        self.session = self.session.replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}
// remove lines matching prefix from a media section specified by mediaindex
// TODO: non-numeric mediaindex could match mid
SDP.prototype.removeMediaLines = function(mediaindex, prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.media[mediaindex], prefix);
    lines.forEach(function(line) {
        self.media[mediaindex] = self.media[mediaindex].replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}

// add content's to a jingle element
SDP.prototype.toJingle = function (elem, thecreator) {
    var i, j, k, mline, ssrc, rtpmap, tmp, line, lines;
    var self = this;
    // new bundle plan
    if (SDPUtil.find_line(this.session, 'a=group:')) {
        lines = SDPUtil.find_lines(this.session, 'a=group:');
        for (i = 0; i < lines.length; i++) {
            tmp = lines[i].split(' ');
            var semantics = tmp.shift().substr(8);
            elem.c('group', {xmlns: 'urn:xmpp:jingle:apps:grouping:0', semantics:semantics});
            for (j = 0; j < tmp.length; j++) {
                elem.c('content', {name: tmp[j]}).up();
            }
            elem.up();
        }
    }
    // old bundle plan, to be removed
    var bundle = [];
    if (SDPUtil.find_line(this.session, 'a=group:BUNDLE')) {
        bundle = SDPUtil.find_line(this.session, 'a=group:BUNDLE ').split(' ');
        bundle.shift();
    }
    for (i = 0; i < this.media.length; i++) {
        mline = SDPUtil.parse_mline(this.media[i].split('\r\n')[0]);
        if (!(mline.media == 'audio' || mline.media == 'video')) {
            continue;
        }
        if (SDPUtil.find_line(this.media[i], 'a=ssrc:')) {
            ssrc = SDPUtil.find_line(this.media[i], 'a=ssrc:').substring(7).split(' ')[0]; // take the first
        } else {
            ssrc = false;
        }

        elem.c('content', {creator: thecreator, name: mline.media});
        if (SDPUtil.find_line(this.media[i], 'a=mid:')) {
            // prefer identifier from a=mid if present
            var mid = SDPUtil.parse_mid(SDPUtil.find_line(this.media[i], 'a=mid:'));
            elem.attrs({ name: mid });

            // old BUNDLE plan, to be removed
            if (bundle.indexOf(mid) != -1) {
                elem.c('bundle', {xmlns: 'http://estos.de/ns/bundle'}).up();
                bundle.splice(bundle.indexOf(mid), 1);
            }
        }
        if (SDPUtil.find_line(this.media[i], 'a=rtpmap:').length) {
            elem.c('description',
                 {xmlns: 'urn:xmpp:jingle:apps:rtp:1',
                  media: mline.media });
            if (ssrc) {
                elem.attrs({ssrc: ssrc});
            }
            for (j = 0; j < mline.fmt.length; j++) {
                rtpmap = SDPUtil.find_line(this.media[i], 'a=rtpmap:' + mline.fmt[j]);
                elem.c('payload-type', SDPUtil.parse_rtpmap(rtpmap));
                // put any 'a=fmtp:' + mline.fmt[j] lines into <param name=foo value=bar/>
                if (SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j])) {
                    tmp = SDPUtil.parse_fmtp(SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j]));
                    for (k = 0; k < tmp.length; k++) {
                        elem.c('parameter', tmp[k]).up();
                    }
                }
                this.RtcpFbToJingle(i, elem, mline.fmt[j]); // XEP-0293 -- map a=rtcp-fb

                elem.up();
            }
            if (SDPUtil.find_line(this.media[i], 'a=crypto:', this.session)) {
                elem.c('encryption', {required: 1});
                var crypto = SDPUtil.find_lines(this.media[i], 'a=crypto:', this.session);
                crypto.forEach(function(line) {
                    elem.c('crypto', SDPUtil.parse_crypto(line)).up();
                });
                elem.up(); // end of encryption
            }

            if (ssrc) {
                // new style mapping
                elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                // FIXME: group by ssrc and support multiple different ssrcs
                var ssrclines = SDPUtil.find_lines(this.media[i], 'a=ssrc:');
                ssrclines.forEach(function(line) {
                    idx = line.indexOf(' ');
                    var linessrc = line.substr(0, idx).substr(7);
                    if (linessrc != ssrc) {
                        elem.up();
                        ssrc = linessrc;
                        elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                    }
                    var kv = line.substr(idx + 1);
                    elem.c('parameter');
                    if (kv.indexOf(':') == -1) {
                        elem.attrs({ name: kv });
                    } else {
                        elem.attrs({ name: kv.split(':', 2)[0] });
                        elem.attrs({ value: kv.split(':', 2)[1] });
                    }
                    elem.up();
                });
                elem.up();

                // old proprietary mapping, to be removed at some point
                tmp = SDPUtil.parse_ssrc(this.media[i]);
                tmp.xmlns = 'http://estos.de/ns/ssrc';
                tmp.ssrc = ssrc;
                elem.c('ssrc', tmp).up(); // ssrc is part of description
            }

            if (SDPUtil.find_line(this.media[i], 'a=rtcp-mux')) {
                elem.c('rtcp-mux').up();
            }

            // XEP-0293 -- map a=rtcp-fb:*
            this.RtcpFbToJingle(i, elem, '*');

            // XEP-0294
            if (SDPUtil.find_line(this.media[i], 'a=extmap:')) {
                lines = SDPUtil.find_lines(this.media[i], 'a=extmap:');
                for (j = 0; j < lines.length; j++) {
                    tmp = SDPUtil.parse_extmap(lines[j]);
                    elem.c('rtp-hdrext', { xmlns: 'urn:xmpp:jingle:apps:rtp:rtp-hdrext:0',
                                    uri: tmp.uri,
                                    id: tmp.value });
                    if (tmp.hasOwnProperty('direction')) {
                        switch (tmp.direction) {
                        case 'sendonly':
                            elem.attrs({senders: 'responder'});
                            break;
                        case 'recvonly':
                            elem.attrs({senders: 'initiator'});
                            break;
                        case 'sendrecv':
                            elem.attrs({senders: 'both'});
                            break;
                        case 'inactive':
                            elem.attrs({senders: 'none'});
                            break;
                        }
                    }
                    // TODO: handle params
                    elem.up();
                }
            }
            elem.up(); // end of description
        }

        // map ice-ufrag/pwd, dtls fingerprint, candidates
        this.TransportToJingle(i, elem);

        if (SDPUtil.find_line(this.media[i], 'a=sendrecv', this.session)) {
            elem.attrs({senders: 'both'});
        } else if (SDPUtil.find_line(this.media[i], 'a=sendonly', this.session)) {
            elem.attrs({senders: 'initiator'});
        } else if (SDPUtil.find_line(this.media[i], 'a=recvonly', this.session)) {
            elem.attrs({senders: 'responder'});
        } else if (SDPUtil.find_line(this.media[i], 'a=inactive', this.session)) {
            elem.attrs({senders: 'none'});
        }
        if (mline.port == '0') {
            // estos hack to reject an m-line
            elem.attrs({senders: 'rejected'});
        }
        elem.up(); // end of content
    }
    elem.up();
    return elem;
};

SDP.prototype.TransportToJingle = function (mediaindex, elem) {
    var i = mediaindex;
    var tmp;
    var self = this;
    elem.c('transport');

    // XEP-0320
    var fingerprints = SDPUtil.find_lines(this.media[mediaindex], 'a=fingerprint:', this.session);
    fingerprints.forEach(function(line) {
        tmp = SDPUtil.parse_fingerprint(line);
        tmp.xmlns = 'urn:xmpp:tmp:jingle:apps:dtls:0';
        // tmp.xmlns = 'urn:xmpp:jingle:apps:dtls:0'; -- FIXME: update receivers first
        elem.c('fingerprint').t(tmp.fingerprint);
        delete tmp.fingerprint;
        line = SDPUtil.find_line(self.media[mediaindex], 'a=setup:', self.session);
        if (line) {
            tmp.setup = line.substr(8);
        }
        elem.attrs(tmp);
        elem.up(); // end of fingerprint
    });
    tmp = SDPUtil.iceparams(this.media[mediaindex], this.session);
    if (tmp) {
        tmp.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
        elem.attrs(tmp);
        // XEP-0176
        if (SDPUtil.find_line(this.media[mediaindex], 'a=candidate:', this.session)) { // add any a=candidate lines
            var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=candidate:', this.session);
            lines.forEach(function (line) {
                elem.c('candidate', SDPUtil.candidateToJingle(line)).up();
            });
        }
    }
    elem.up(); // end of transport
}

SDP.prototype.RtcpFbToJingle = function (mediaindex, elem, payloadtype) { // XEP-0293
    var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=rtcp-fb:' + payloadtype);
    lines.forEach(function (line) {
        var tmp = SDPUtil.parse_rtcpfb(line);
        if (tmp.type == 'trr-int') {
            elem.c('rtcp-fb-trr-int', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', value: tmp.params[0]});
            elem.up();
        } else {
            elem.c('rtcp-fb', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', type: tmp.type});
            if (tmp.params.length > 0) {
                elem.attrs({'subtype': tmp.params[0]});
            }
            elem.up();
        }
    });
};

SDP.prototype.RtcpFbFromJingle = function (elem, payloadtype) { // XEP-0293
    var media = '';
    var tmp = elem.find('>rtcp-fb-trr-int[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    if (tmp.length) {
        media += 'a=rtcp-fb:' + '*' + ' ' + 'trr-int' + ' ';
        if (tmp.attr('value')) {
            media += tmp.attr('value');
        } else {
            media += '0';
        }
        media += '\r\n';
    }
    tmp = elem.find('>rtcp-fb[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    tmp.each(function () {
        media += 'a=rtcp-fb:' + payloadtype + ' ' + $(this).attr('type');
        if ($(this).attr('subtype')) {
            media += ' ' + $(this).attr('subtype');
        }
        media += '\r\n';
    });
    return media;
};

// construct an SDP from a jingle stanza
SDP.prototype.fromJingle = function (jingle) {
    var self = this;
    this.raw = 'v=0\r\n' +
        'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
        's=-\r\n' +
        't=0 0\r\n';
    // http://tools.ietf.org/html/draft-ietf-mmusic-sdp-bundle-negotiation-04#section-8
    if ($(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').length) {
        $(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').each(function (idx, group) {
            var contents = $(group).find('>content').map(function (idx, content) {
                return content.getAttribute('name');
            }).get();
            if (contents.length > 0) {
                self.raw += 'a=group:' + (group.getAttribute('semantics') || group.getAttribute('type')) + ' ' + contents.join(' ') + '\r\n';
            }
        });
    } else if ($(jingle).find('>group[xmlns="urn:ietf:rfc:5888"]').length) {
        // temporary namespace, not to be used. to be removed soon.
        $(jingle).find('>group[xmlns="urn:ietf:rfc:5888"]').each(function (idx, group) {
            var contents = $(group).find('>content').map(function (idx, content) {
                return content.getAttribute('name');
            }).get();
            if (group.getAttribute('type') !== null && contents.length > 0) {
                self.raw += 'a=group:' + group.getAttribute('type') + ' ' + contents.join(' ') + '\r\n';
            }
        });
    } else {
        // for backward compability, to be removed soon
        // assume all contents are in the same bundle group, can be improved upon later
        var bundle = $(jingle).find('>content').filter(function (idx, content) {
            //elem.c('bundle', {xmlns:'http://estos.de/ns/bundle'});
            return $(content).find('>bundle').length > 0;
        }).map(function (idx, content) {
            return content.getAttribute('name');
        }).get();
        if (bundle.length) {
            this.raw += 'a=group:BUNDLE ' + bundle.join(' ') + '\r\n';
        }
    }

    this.session = this.raw;
    jingle.find('>content').each(function () {
        var m = self.jingle2media($(this));
        self.media.push(m);
    });

    // reconstruct msid-semantic -- apparently not necessary
    /*
    var msid = SDPUtil.parse_ssrc(this.raw);
    if (msid.hasOwnProperty('mslabel')) {
        this.session += "a=msid-semantic: WMS " + msid.mslabel + "\r\n";
    }
    */

    this.raw = this.session + this.media.join('');
};

// translate a jingle content element into an an SDP media part
SDP.prototype.jingle2media = function (content) {
    var media = '',
        desc = content.find('description'),
        ssrc = desc.attr('ssrc'),
        self = this,
        tmp;

    tmp = { media: desc.attr('media') };
    tmp.port = '1';
    if (content.attr('senders') == 'rejected') {
        // estos hack to reject an m-line.
        tmp.port = '0';
    }
    if (content.find('>transport>fingerprint').length || desc.find('encryption').length) {
        tmp.proto = 'RTP/SAVPF';
    } else {
        tmp.proto = 'RTP/AVPF';
    }
    tmp.fmt = desc.find('payload-type').map(function () { return this.getAttribute('id'); }).get();
    media += SDPUtil.build_mline(tmp) + '\r\n';
    media += 'c=IN IP4 0.0.0.0\r\n';
    media += 'a=rtcp:1 IN IP4 0.0.0.0\r\n';
    tmp = content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]');
    if (tmp.length) {
        if (tmp.attr('ufrag')) {
            media += SDPUtil.build_iceufrag(tmp.attr('ufrag')) + '\r\n';
        }
        if (tmp.attr('pwd')) {
            media += SDPUtil.build_icepwd(tmp.attr('pwd')) + '\r\n';
        }
        tmp.find('>fingerprint').each(function () {
            // FIXME: check namespace at some point
            media += 'a=fingerprint:' + this.getAttribute('hash');
            media += ' ' + $(this).text();
            media += '\r\n';
            if (this.getAttribute('setup')) {
                media += 'a=setup:' + this.getAttribute('setup') + '\r\n';
            }
        });
    }
    switch (content.attr('senders')) {
    case 'initiator':
        media += 'a=sendonly\r\n';
        break;
    case 'responder':
        media += 'a=recvonly\r\n';
        break;
    case 'none':
        media += 'a=inactive\r\n';
        break;
    case 'both':
        media += 'a=sendrecv\r\n';
        break;
    }
    media += 'a=mid:' + content.attr('name') + '\r\n';

    // <description><rtcp-mux/></description>
    // see http://code.google.com/p/libjingle/issues/detail?id=309 -- no spec though
    // and http://mail.jabber.org/pipermail/jingle/2011-December/001761.html
    if (desc.find('rtcp-mux').length) {
        media += 'a=rtcp-mux\r\n';
    }

    if (desc.find('encryption').length) {
        desc.find('encryption>crypto').each(function () {
            media += 'a=crypto:' + this.getAttribute('tag');
            media += ' ' + this.getAttribute('crypto-suite');
            media += ' ' + this.getAttribute('key-params');
            if (this.getAttribute('session-params')) {
                media += ' ' + this.getAttribute('session-params');
            }
            media += '\r\n';
        });
    }
    desc.find('payload-type').each(function () {
        media += SDPUtil.build_rtpmap(this) + '\r\n';
        if ($(this).find('>parameter').length) {
            media += 'a=fmtp:' + this.getAttribute('id') + ' ';
            media += $(this).find('parameter').map(function () { return (this.getAttribute('name') ? (this.getAttribute('name') + '=') : '') + this.getAttribute('value'); }).get().join(';');
            media += '\r\n';
        }
        // xep-0293
        media += self.RtcpFbFromJingle($(this), this.getAttribute('id'));
    });

    // xep-0293
    media += self.RtcpFbFromJingle(desc, '*');

    // xep-0294
    tmp = desc.find('>rtp-hdrext[xmlns="urn:xmpp:jingle:apps:rtp:rtp-hdrext:0"]');
    tmp.each(function () {
        media += 'a=extmap:' + this.getAttribute('id') + ' ' + this.getAttribute('uri') + '\r\n';
    });

    content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]>candidate').each(function () {
        media += SDPUtil.candidateFromJingle(this);
    });

    tmp = content.find('description>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
    tmp.each(function () {
        var ssrc = this.getAttribute('ssrc');
        $(this).find('>parameter').each(function () {
            media += 'a=ssrc:' + ssrc + ' ' + this.getAttribute('name');
            if (this.getAttribute('value') && this.getAttribute('value').length)
                media += ':' + this.getAttribute('value');
            media += '\r\n';
        });
    });

    if (tmp.length === 0) {
        // fallback to proprietary mapping of a=ssrc lines
        tmp = content.find('description>ssrc[xmlns="http://estos.de/ns/ssrc"]');
        if (tmp.length) {
            media += 'a=ssrc:' + ssrc + ' cname:' + tmp.attr('cname') + '\r\n';
            media += 'a=ssrc:' + ssrc + ' msid:' + tmp.attr('msid') + '\r\n';
            media += 'a=ssrc:' + ssrc + ' mslabel:' + tmp.attr('mslabel') + '\r\n';
            media += 'a=ssrc:' + ssrc + ' label:' + tmp.attr('label') + '\r\n';
        }
    }
    return media;
};

SDPUtil = {
    iceparams: function (mediadesc, sessiondesc) {
        var data = null;
        if (SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc) &&
            SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc)) {
            data = {
                ufrag: SDPUtil.parse_iceufrag(SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc)),
                pwd: SDPUtil.parse_icepwd(SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc))
            };
        }
        return data;
    },
    parse_iceufrag: function (line) {
        return line.substring(12);
    },
    build_iceufrag: function (frag) {
        return 'a=ice-ufrag:' + frag;
    },
    parse_icepwd: function (line) {
        return line.substring(10);
    },
    build_icepwd: function (pwd) {
        return 'a=ice-pwd:' + pwd;
    },
    parse_mid: function (line) {
        return line.substring(6);
    },
    parse_mline: function (line) {
        var parts = line.substring(2).split(' '),
        data = {};
        data.media = parts.shift();
        data.port = parts.shift();
        data.proto = parts.shift();
        if (parts[parts.length - 1] === '') { // trailing whitespace
            parts.pop();
        }
        data.fmt = parts;
        return data;
    },
    build_mline: function (mline) {
        return 'm=' + mline.media + ' ' + mline.port + ' ' + mline.proto + ' ' + mline.fmt.join(' ');
    },
    parse_rtpmap: function (line) {
        var parts = line.substring(9).split(' '),
            data = {};
        data.id = parts.shift();
        parts = parts[0].split('/');
        data.name = parts.shift();
        data.clockrate = parts.shift();
        data.channels = parts.length ? parts.shift() : '1';
        return data;
    },
    build_rtpmap: function (el) {
        var line = 'a=rtpmap:' + el.getAttribute('id') + ' ' + el.getAttribute('name') + '/' + el.getAttribute('clockrate');
        if (el.getAttribute('channels') && el.getAttribute('channels') != '1') {
            line += '/' + el.getAttribute('channels');
        }
        return line;
    },
    parse_crypto: function (line) {
        var parts = line.substring(9).split(' '),
        data = {};
        data.tag = parts.shift();
        data['crypto-suite'] = parts.shift();
        data['key-params'] = parts.shift();
        if (parts.length) {
            data['session-params'] = parts.join(' ');
        }
        return data;
    },
    parse_fingerprint: function (line) { // RFC 4572
        var parts = line.substring(14).split(' '),
        data = {};
        data.hash = parts.shift();
        data.fingerprint = parts.shift();
        // TODO assert that fingerprint satisfies 2UHEX *(":" 2UHEX) ?
        return data;
    },
    parse_fmtp: function (line) {
        var parts = line.split(' '),
            i, key, value,
            data = [];
        parts.shift();
        parts = parts.join(' ').split(';');
        for (i = 0; i < parts.length; i++) {
            key = parts[i].split('=')[0];
            while (key.length && key[0] == ' ') {
                key = key.substring(1);
            }
            value = parts[i].split('=')[1];
            if (key && value) {
                data.push({name: key, value: value});
            } else if (key) {
                // rfc 4733 (DTMF) style stuff
                data.push({name: '', value: key});
            }
        }
        return data;
    },
    parse_icecandidate: function (line) {
        var candidate = {},
            elems = line.split(' ');
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];
        candidate.generation = 0; // default value, may be overwritten below
        for (var i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
            case 'raddr':
                candidate['rel-addr'] = elems[i + 1];
                break;
            case 'rport':
                candidate['rel-port'] = elems[i + 1];
                break;
            case 'generation':
                candidate.generation = elems[i + 1];
                break;
            default: // TODO
                console.log('parse_icecandidate not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    build_icecandidate: function (cand) {
        var line = ['a=candidate:' + cand.foundation, cand.component, cand.protocol, cand.priority, cand.ip, cand.port, 'typ', cand.type].join(' ');
        line += ' ';
        switch (cand.type) {
        case 'srflx':
        case 'prflx':
        case 'relay':
            if (cand.hasOwnAttribute('rel-addr') && cand.hasOwnAttribute('rel-port')) {
                line += 'raddr';
                line += ' ';
                line += cand['rel-addr'];
                line += ' ';
                line += 'rport';
                line += ' ';
                line += cand['rel-port'];
                line += ' ';
            }
            break;
        }
        line += 'generation';
        line += ' ';
        line += cand.hasOwnAttribute('generation') ? cand.generation : '0';
        return line;
    },
    parse_ssrc: function (desc) {
        // proprietary mapping of a=ssrc lines
        // TODO: see "Jingle RTP Source Description" by Juberti and P. Thatcher on google docs
        // and parse according to that
        var lines = desc.split('\r\n'),
            data = {};
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, 7) == 'a=ssrc:') {
                var idx = lines[i].indexOf(' ');
                data[lines[i].substr(idx + 1).split(':', 2)[0]] = lines[i].substr(idx + 1).split(':', 2)[1];
            }
        }
        return data;
    },
    parse_rtcpfb: function (line) {
        var parts = line.substr(10).split(' ');
        var data = {};
        data.pt = parts.shift();
        data.type = parts.shift();
        data.params = parts;
        return data;
    },
    parse_extmap: function (line) {
        var parts = line.substr(9).split(' ');
        var data = {};
        data.value = parts.shift();
        if (data.value.indexOf('/') != -1) {
            data.direction = data.value.substr(data.value.indexOf('/') + 1);
            data.value = data.value.substr(0, data.value.indexOf('/'));
        } else {
            data.direction = 'both';
        }
        data.uri = parts.shift();
        data.params = parts;
        return data;
    },
    find_line: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle) {
                return lines[i];
            }
        }
        if (!sessionpart) {
            return false;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                return lines[j];
            }
        }
        return false;
    },
    find_lines: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n'),
            needles = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle)
                needles.push(lines[i]);
        }
        if (needles.length || !sessionpart) {
            return needles;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                needles.push(lines[j]);
            }
        }
        return needles;
    },
    candidateToJingle: function (line) {
        // a=candidate:2979166662 1 udp 2113937151 192.168.2.100 57698 typ host generation 0
        //      <candidate component=... foundation=... generation=... id=... ip=... network=... port=... priority=... protocol=... type=.../>
        if (line.substring(0, 12) != 'a=candidate:') {
            console.log('parseCandidate called with a line that is not a candidate line');
            console.log(line);
            return null;
        }
        if (line.substring(line.length - 2) == '\r\n') // chomp it
            line = line.substring(0, line.length - 2);
        var candidate = {},
            elems = line.split(' '),
            i;
        if (elems[6] != 'typ') {
            console.log('did not find typ in the right place');
            console.log(line);
            return null;
        }
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];
        for (i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
            case 'raddr':
                candidate['rel-addr'] = elems[i + 1];
                break;
            case 'rport':
                candidate['rel-port'] = elems[i + 1];
                break;
            case 'generation':
                candidate.generation = elems[i + 1];
                break;
            default: // TODO
                console.log('not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    candidateFromJingle: function (cand) {
        var line = 'a=candidate:';
        line += cand.getAttribute('foundation');
        line += ' ';
        line += cand.getAttribute('component');
        line += ' ';
        line += cand.getAttribute('protocol'); //.toUpperCase(); // chrome M23 doesn't like this
        line += ' ';
        line += cand.getAttribute('priority');
        line += ' ';
        line += cand.getAttribute('ip');
        line += ' ';
        line += cand.getAttribute('port');
        line += ' ';
        line += 'typ';
        line += ' ' + cand.getAttribute('type');
        line += ' ';
        switch (cand.getAttribute('type')) {
        case 'srflx':
        case 'prflx':
        case 'relay':
            if (cand.getAttribute('rel-addr') && cand.getAttribute('rel-port')) {
                line += 'raddr';
                line += ' ';
                line += cand.getAttribute('rel-addr');
                line += ' ';
                line += 'rport';
                line += ' ';
                line += cand.getAttribute('rel-port');
                line += ' ';
            }
            break;
        }
        line += 'generation';
        line += ' ';
        line += cand.getAttribute('generation') || '0';
        return line + '\r\n';
    }
};
/* jshint -W117 */
// Jingle stuff
function JingleSession(me, sid, connection) {
    this.me = me;
    this.sid = sid;
    this.connection = connection;
    this.initiator = null;
    this.responder = null;
    this.isInitiator = null;
    this.peerjid = null;
    this.state = null;
    this.peerconnection = null;
    this.remoteStream = null;
    this.localSDP = null;
    this.remoteSDP = null;
    this.localStreams = [];
    this.relayedStreams = [];
    this.remoteStreams = [];
    this.startTime = null;
    this.stopTime = null;
    this.media_constraints = null;
    this.pc_constraints = null;
    this.ice_config = {};
    this.drip_container = [];

    this.usetrickle = true;
    this.usepranswer = false; // early transport warmup -- mind you, this might fail. depends on webrtc issue 1718
    this.usedrip = false; // dripping is sending trickle candidates not one-by-one

    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;

    this.statsinterval = null;

    this.reason = null;

    this.addssrc = [];
    this.removessrc = [];
    this.pendingop = null;

    this.wait = true;
}

JingleSession.prototype.initiate = function (peerjid, isInitiator) {
    var self = this;
    if (this.state !== null) {
        console.error('attempt to initiate on session ' + this.sid +
                  'in state ' + this.state);
        return;
    }
    this.isInitiator = isInitiator;
    this.state = 'pending';
    this.initiator = isInitiator ? this.me : peerjid;
    this.responder = !isInitiator ? this.me : peerjid;
    this.peerjid = peerjid;
    //console.log('create PeerConnection ' + JSON.stringify(this.ice_config));
    try {
        this.peerconnection = new RTCPeerconnection(this.ice_config,
                                                     this.pc_constraints);
    } catch (e) {
        console.error('Failed to create PeerConnection, exception: ',
                      e.message);
        console.error(e);
        return;
    }
    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;
    this.peerconnection.onicecandidate = function (event) {
        self.sendIceCandidate(event.candidate);
    };
    this.peerconnection.onaddstream = function (event) {
        self.remoteStream = event.stream;
        self.remoteStreams.push(event.stream);
        $(document).trigger('remotestreamadded.jingle', [event, self.sid]);
    };
    this.peerconnection.onremovestream = function (event) {
        self.remoteStream = null;
        // FIXME: remove from this.remoteStreams
        $(document).trigger('remotestreamremoved.jingle', [event, self.sid]);
    };
    this.peerconnection.onsignalingstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
    };
    this.peerconnection.oniceconnectionstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
        switch (self.peerconnection.iceConnectionState) {
        case 'connected':
            this.startTime = new Date();
            break;
        case 'disconnected':
            this.stopTime = new Date();
            break;
        }
        $(document).trigger('iceconnectionstatechange.jingle', [self.sid, self]);
    };
    // add any local and relayed stream
    this.localStreams.forEach(function(stream) {
        self.peerconnection.addStream(stream);
    });
    this.relayedStreams.forEach(function(stream) {
        self.peerconnection.addStream(stream);
    });
};

JingleSession.prototype.accept = function () {
    var self = this;
    this.state = 'active';

    var pranswer = this.peerconnection.localDescription;
    if (!pranswer || pranswer.type != 'pranswer') {
        return;
    }
    console.log('going from pranswer to answer');
    if (this.usetrickle) {
        // remove candidates already sent from session-accept
        var lines = SDPUtil.find_lines(pranswer.sdp, 'a=candidate:');
        for (var i = 0; i < lines.length; i++) {
            pranswer.sdp = pranswer.sdp.replace(lines[i] + '\r\n', '');
        }
    }
    while (SDPUtil.find_line(pranswer.sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        pranswer.sdp = pranswer.sdp.replace('a=inactive', 'a=sendrecv');
    }
    var prsdp = new SDP(pranswer.sdp);
    var accept = $iq({to: this.peerjid,
             type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
           action: 'session-accept',
           initiator: this.initiator,
           responder: this.responder,
           sid: this.sid });
    prsdp.toJingle(accept, this.initiator == this.me ? 'initiator' : 'responder');
    this.connection.sendIQ(accept,
        function () {
            var ack = {};
            ack.source = 'answer';
            $(document).trigger('ack.jingle', [self.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            error.source = 'answer';
            $(document).trigger('error.jingle', [self.sid, error]);
        },
    10000);

    var sdp = this.peerconnection.localDescription.sdp;
    while (SDPUtil.find_line(sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        sdp = sdp.replace('a=inactive', 'a=sendrecv');
    }
    this.peerconnection.setLocalDescription(new RTCSessionDescription({type: 'answer', sdp: sdp}),
        function () {
            //console.log('setLocalDescription success');
            $(document).trigger('setLocalDescription.jingle', [self.sid]);
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
};

JingleSession.prototype.terminate = function (reason) {
    this.state = 'ended';
    this.reason = reason;
    this.peerconnection.close();
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};

JingleSession.prototype.active = function () {
    return this.state == 'active';
};

JingleSession.prototype.sendIceCandidate = function (candidate) {
    var self = this;
    if (candidate && !this.lasticecandidate) {
        var ice = SDPUtil.iceparams(this.localSDP.media[candidate.sdpMLineIndex], this.localSDP.session);
        var jcand = SDPUtil.candidateToJingle(candidate.candidate);
        if (!(ice && jcand)) {
            console.error('failed to get ice && jcand');
            return;
        }
        ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';

        if (jcand.type === 'srflx') {
            this.hadstuncandidate = true;
        } else if (jcand.type === 'relay') {
            this.hadturncandidate = true;
        }

        if (this.usetrickle) {
            if (this.usedrip) {
                if (this.drip_container.length === 0) {
                    // start 20ms callout
                    window.setTimeout(function () {
                        if (self.drip_container.length === 0) return;
                        self.sendIceCandidates(self.drip_container);
                        self.drip_container = [];
                    }, 20);

                }
                this.drip_container.push(event.candidate);
                return;
            } else {
                self.sendIceCandidate([event.candidate]);
            }
        }
    } else {
        //console.log('sendIceCandidate: last candidate.');
        if (!this.usetrickle) {
            //console.log('should send full offer now...');
            var init = $iq({to: this.peerjid,
                       type: 'set'})
                .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                   action: this.peerconnection.localDescription.type == 'offer' ? 'session-initiate' : 'session-accept',
                   initiator: this.initiator,
                   sid: this.sid});
            this.localSDP = new SDP(this.peerconnection.localDescription.sdp);
            this.localSDP.toJingle(init, this.initiator == this.me ? 'initiator' : 'responder');
            this.connection.sendIQ(init,
                function () {
                    //console.log('session initiate ack');
                    var ack = {};
                    ack.source = 'offer';
                    $(document).trigger('ack.jingle', [self.sid, ack]);
                },
                function (stanza) {
                    self.state = 'error';
                    self.peerconnection.close();
                    var error = ($(stanza).find('error').length) ? {
                        code: $(stanza).find('error').attr('code'),
                        reason: $(stanza).find('error :first')[0].tagName,
                    }:{};
                    error.source = 'offer';
                    $(document).trigger('error.jingle', [self.sid, error]);
                },
            10000);
        }
        this.lasticecandidate = true;
        console.log('Have we encountered any srflx candidates? ' + this.hadstuncandidate);
        console.log('Have we encountered any relay candidates? ' + this.hadturncandidate);

        if (!(this.hadstuncandidate || this.hadturncandidate) && this.peerconnection.signalingState != 'closed') {
            $(document).trigger('nostuncandidates.jingle', [this.sid]);
        }
    }
};

JingleSession.prototype.sendIceCandidates = function (candidates) {
    console.log('sendIceCandidates', candidates);
    var cand = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
           action: 'transport-info',
           initiator: this.initiator,
           sid: this.sid});
    for (var mid = 0; mid < this.localSDP.media.length; mid++) {
        var cands = candidates.filter(function (el) { return el.sdpMLineIndex == mid; });
        if (cands.length > 0) {
            var ice = SDPUtil.iceparams(this.localSDP.media[mid], this.localSDP.session);
            ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
            cand.c('content', {creator: this.initiator == this.me ? 'initiator' : 'responder',
                   name: cands[0].sdpMid
            }).c('transport', ice);
            for (var i = 0; i < cands.length; i++) {
                cand.c('candidate', SDPUtil.candidateToJingle(cands[i].candidate)).up();
            }
            // add fingerprint
            if (SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session)) {
                var tmp = SDPUtil.parse_fingerprint(SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session));
                tmp.required = true;
                cand.c('fingerprint').t(tmp.fingerprint);
                delete tmp.fingerprint;
                cand.attrs(tmp);
                cand.up();
            }
            cand.up(); // transport
            cand.up(); // content
        }
    }
    // might merge last-candidate notification into this, but it is called alot later. See webrtc issue #2340
    //console.log('was this the last candidate', this.lasticecandidate);
    this.connection.sendIQ(cand,
        function () {
            var ack = {};
            ack.source = 'transportinfo';
            $(document).trigger('ack.jingle', [this.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            error.source = 'transportinfo';
            $(document).trigger('error.jingle', [this.sid, error]);
        },
    10000);
};


JingleSession.prototype.sendOffer = function () {
    //console.log('sendOffer...');
    var self = this;
    this.peerconnection.createOffer(function (sdp) {
            self.createdOffer(sdp);
        },
        function (e) {
            console.error('createOffer failed', e);
        },
        this.media_constraints
    );
};

JingleSession.prototype.createdOffer = function (sdp) {
    //console.log('createdOffer', sdp);
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    if (this.usetrickle) {
        var init = $iq({to: this.peerjid,
                   type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
               action: 'session-initiate',
               initiator: this.initiator,
               sid: this.sid});
        this.localSDP.toJingle(init, this.initiator == this.me ? 'initiator' : 'responder');
        this.connection.sendIQ(init,
            function () {
                var ack = {};
                ack.source = 'offer';
                $(document).trigger('ack.jingle', [self.sid, ack]);
            },
            function (stanza) {
                self.state = 'error';
                self.peerconnection.close();
                var error = ($(stanza).find('error').length) ? {
                    code: $(stanza).find('error').attr('code'),
                    reason: $(stanza).find('error :first')[0].tagName,
                }:{};
                error.source = 'offer';
                $(document).trigger('error.jingle', [self.sid, error]);
            },
        10000);
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp, 
        function () {
            $(document).trigger('setLocalDescription.jingle', [self.sid]);
            //console.log('setLocalDescription success');
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var i = 0; i < cands.length; i++) {
        var cand = SDPUtil.parse_icecandidate(cands[i]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSession.prototype.setRemoteDescription = function (elem, desctype) {
    //console.log('setting remote description... ', desctype);
    this.remoteSDP = new SDP('');
    this.remoteSDP.fromJingle(elem);
    if (this.peerconnection.remoteDescription !== null) {
        console.log('setRemoteDescription when remote description is not null, should be pranswer', this.peerconnection.remoteDescription);
        if (this.peerconnection.remoteDescription.type == 'pranswer') {
            var pranswer = new SDP(this.peerconnection.remoteDescription.sdp);
            for (var i = 0; i < pranswer.media.length; i++) {
                // make sure we have ice ufrag and pwd
                if (!SDPUtil.find_line(this.remoteSDP.media[i], 'a=ice-ufrag:', this.remoteSDP.session)) {
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session) + '\r\n';
                    } else {
                        console.warn('no ice ufrag?');
                    }
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session) + '\r\n';
                    } else {
                        console.warn('no ice pwd?');
                    }
                }
                // copy over candidates
                var lines = SDPUtil.find_lines(pranswer.media[i], 'a=candidate:');
                for (var j = 0; j < lines.length; j++) {
                    this.remoteSDP.media[i] += lines[j] + '\r\n';
                }
            }
            this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');
        }
    }
    var remotedesc = new RTCSessionDescription({type: desctype, sdp: this.remoteSDP.raw});
    
    this.peerconnection.setRemoteDescription(remotedesc,
        function () {
            //console.log('setRemoteDescription success');
        },
        function (e) {
            console.error('setRemoteDescription error', e);
        }
    );
};

JingleSession.prototype.addIceCandidate = function (elem) {
    var self = this;
    if (this.peerconnection.signalingState == 'closed') {
        return;
    }
    if (!this.peerconnection.remoteDescription && this.peerconnection.signalingState == 'have-local-offer') {
        console.log('trickle ice candidate arriving before session accept...');
        // create a PRANSWER for setRemoteDescription
        if (!this.remoteSDP) {
            var cobbled = 'v=0\r\n' +
                'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
                's=-\r\n' +
                't=0 0\r\n';
            // first, take some things from the local description
            for (var i = 0; i < this.localSDP.media.length; i++) {
                cobbled += SDPUtil.find_line(this.localSDP.media[i], 'm=') + '\r\n';
                cobbled += SDPUtil.find_lines(this.localSDP.media[i], 'a=rtpmap:').join('\r\n') + '\r\n';
                if (SDPUtil.find_line(this.localSDP.media[i], 'a=mid:')) {
                    cobbled += SDPUtil.find_line(this.localSDP.media[i], 'a=mid:') + '\r\n';
                }
                cobbled += 'a=inactive\r\n';
            }
            this.remoteSDP = new SDP(cobbled);
        }
        // then add things like ice and dtls from remote candidate
        elem.each(function () {
            for (var i = 0; i < self.remoteSDP.media.length; i++) {
                if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                        self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    if (!SDPUtil.find_line(self.remoteSDP.media[i], 'a=ice-ufrag:')) {
                        var tmp = $(this).find('transport');
                        self.remoteSDP.media[i] += 'a=ice-ufrag:' + tmp.attr('ufrag') + '\r\n';
                        self.remoteSDP.media[i] += 'a=ice-pwd:' + tmp.attr('pwd') + '\r\n';
                        tmp = $(this).find('transport>fingerprint');
                        if (tmp.length) {
                            self.remoteSDP.media[i] += 'a=fingerprint:' + tmp.attr('hash') + ' ' + tmp.text() + '\r\n';
                        } else {
                            console.log('no dtls fingerprint (webrtc issue #1718?)');
                            self.remoteSDP.media[i] += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
                        }
                        break;
                    }
                }
            }
        });
        this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');

        // we need a complete SDP with ice-ufrag/ice-pwd in all parts
        // this makes the assumption that the PRANSWER is constructed such that the ice-ufrag is in all mediaparts
        // but it could be in the session part as well. since the code above constructs this sdp this can't happen however
        var iscomplete = this.remoteSDP.media.filter(function (mediapart) {
            return SDPUtil.find_line(mediapart, 'a=ice-ufrag:');
        }).length == this.remoteSDP.media.length;

        if (iscomplete) {
            console.log('setting pranswer');
            try {
                this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'pranswer', sdp: this.remoteSDP.raw }),
                    function() {
                    },
                    function(e) {
                        console.log('setRemoteDescription pranswer failed', e.toString());
                    });
            } catch (e) {
                console.error('setting pranswer failed', e);
            }
        } else {
            //console.log('not yet setting pranswer');
        }
    }
    // operate on each content element
    elem.each(function () {
        // would love to deactivate this, but firefox still requires it
        var idx = -1;
        var i;
        for (i = 0; i < self.remoteSDP.media.length; i++) {
            if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                idx = i;
                break;
            }
        }
        if (idx == -1) { // fall back to localdescription
            for (i = 0; i < self.localSDP.media.length; i++) {
                if (SDPUtil.find_line(self.localSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.localSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    idx = i;
                    break;
                }
            }
        }
        var name = $(this).attr('name');
        // TODO: check ice-pwd and ice-ufrag?
        $(this).find('transport>candidate').each(function () {
            var line, candidate;
            line = SDPUtil.candidateFromJingle(this);
            candidate = new RTCIceCandidate({sdpMLineIndex: idx,
                                            sdpMid: name,
                                            candidate: line});
            try {
                self.peerconnection.addIceCandidate(candidate);
            } catch (e) {
                console.error('addIceCandidate failed', e.toString(), line);
            }
        });
    });
};

JingleSession.prototype.sendAnswer = function (provisional) {
    //console.log('createAnswer', provisional);
    var self = this;
    this.peerconnection.createAnswer(
        function (sdp) {
            self.createdAnswer(sdp, provisional);
        },
        function (e) {
            console.error('createAnswer failed', e);
        },
        this.media_constraints
    );
};

JingleSession.prototype.createdAnswer = function (sdp, provisional) {
    //console.log('createAnswer callback');
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    this.usepranswer = provisional === true;
    if (this.usetrickle) {
        if (!this.usepranswer) {
            var accept = $iq({to: this.peerjid,
                     type: 'set'})
                .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                   action: 'session-accept',
                   initiator: this.initiator,
                   responder: this.responder,
                   sid: this.sid });
            this.localSDP.toJingle(accept, this.initiator == this.me ? 'initiator' : 'responder');
            this.connection.sendIQ(accept,
                function () {
                    var ack = {};
                    ack.source = 'answer';
                    $(document).trigger('ack.jingle', [self.sid, ack]);
                },
                function (stanza) {
                    var error = ($(stanza).find('error').length) ? {
                        code: $(stanza).find('error').attr('code'),
                        reason: $(stanza).find('error :first')[0].tagName,
                    }:{};
                    error.source = 'answer';
                    $(document).trigger('error.jingle', [self.sid, error]);
                },
            10000);
        } else {
            sdp.type = 'pranswer';
            for (var i = 0; i < this.localSDP.media.length; i++) {
                this.localSDP.media[i] = this.localSDP.media[i].replace('a=sendrecv\r\n', 'a=inactive\r\n');
            }
            this.localSDP.raw = this.localSDP.session + '\r\n' + this.localSDP.media.join('');
        }
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp,
        function () {
            $(document).trigger('setLocalDescription.jingle', [self.sid]);
            //console.log('setLocalDescription success');
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var j = 0; j < cands.length; j++) {
        var cand = SDPUtil.parse_icecandidate(cands[j]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSession.prototype.sendTerminate = function (reason, text) {
    var self = this,
        term = $iq({to: this.peerjid,
               type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
           action: 'session-terminate',
           initiator: this.initiator,
           sid: this.sid})
        .c('reason')
        .c(reason || 'success');
        
    if (text) {
        term.up().c('text').t(text);
    }
    
    this.connection.sendIQ(term,
        function () {
            self.peerconnection.close();
            self.peerconnection = null;
            self.terminate();
            var ack = {};
            ack.source = 'terminate';
            $(document).trigger('ack.jingle', [self.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            $(document).trigger('ack.jingle', [self.sid, error]);
        },
    10000);
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};


JingleSession.prototype.addSource = function (elem) {
    console.log('addssrc', new Date().getTime());
    console.log('ice', this.peerconnection.iceConnectionState);
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

    var self = this;
    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        tmp = $(content).find('>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.addssrc[idx]) self.addssrc[idx] = '';
            self.addssrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });
    this.modifySources();
};

JingleSession.prototype.removeSource = function (elem) {
    console.log('removessrc', new Date().getTime());
    console.log('ice', this.peerconnection.iceConnectionState);
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

    var self = this;
    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        tmp = $(content).find('>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.addssrc[idx]) self.removessrc[idx] = '';
            self.removessrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });
    this.modifySources();
};

JingleSession.prototype.modifySources = function() {
    var self = this;
    if (this.peerconnection.signalingState == 'closed') return;
    if (!(this.addssrc.length || this.removessrc.length || this.pendingop !== null)) return;
    if (!(this.peerconnection.signalingState == 'stable' && this.peerconnection.iceConnectionState == 'connected')) {
        console.warn('modifySources not yet', this.peerconnection.signalingState, this.peerconnection.iceConnectionState);
        this.wait = true;
        window.setTimeout(function() { self.modifySources(); }, 250);
        return;
    }
    if (this.wait) {
        window.setTimeout(function() { self.modifySources(); }, 2500);
        this.wait = false;
        return;
    }

    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

    // add sources
    this.addssrc.forEach(function(lines, idx) {
        sdp.media[idx] += lines;
    });
    this.addssrc = [];

    // remove sources
    this.removessrc.forEach(function(lines, idx) {
        lines = lines.split('\r\n');
        lines.pop(); // remove empty last element;
        lines.forEach(function(line) {
            sdp.media[idx] = sdp.media[idx].replace(line + '\r\n', '');
        });
    });
    this.removessrc = [];

    sdp.raw = sdp.session + sdp.media.join('');
    this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'offer', sdp: sdp.raw}),
        function() {
            self.peerconnection.createAnswer(
                function(modifiedAnswer) {
                    // change video direction, see https://github.com/jitsi/jitmeet/issues/41
                    if (self.pendingop !== null) {
                        var sdp = new SDP(modifiedAnswer.sdp);
                        if (sdp.media.length > 1) {
                            switch(self.pendingop) {
                            case 'mute':
                                sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                                break;
                            case 'unmute':
                                sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                                break;
                            }
                            sdp.raw = sdp.session + sdp.media.join('');
                            modifiedAnswer.sdp = sdp.raw;
                        }
                        self.pendingop = null;
                    }

                    self.peerconnection.setLocalDescription(modifiedAnswer,
                        function() {
                            //console.log('modified setLocalDescription ok');
                            $(document).trigger('setLocalDescription.jingle', [self.sid]);
                        },
                        function(error) {
                            console.log('modified setLocalDescription failed');
                        }
                    );
                },
                function(error) {
                    console.log('modified answer failed');
                }
            );
        },
        function(error) {
            console.log('modify failed');
        }
    );
};

// SDP-based mute by going recvonly/sendrecv
// FIXME: should probably black out the screen as well
JingleSession.prototype.hardMuteVideo = function (muted) {
    this.pendingop = muted ? 'mute' : 'unmute';
    this.modifySources();

    this.connection.jingle.localStream.getVideoTracks().forEach(function (track) {
        track.enabled = !muted;
    });
};

JingleSession.prototype.sendMute = function (muted, content) {
    var info = $iq({to: this.peerjid,
             type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
           action: 'session-info',
           initiator: this.initiator,
           sid: this.sid });
    info.c(muted ? 'mute' : 'unmute', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    info.attrs({'creator': this.me == this.initiator ? 'creator' : 'responder'});
    if (content) {
        info.attrs({'name': content});
    }
    this.connection.send(info);
};

JingleSession.prototype.sendRinging = function () {
    var info = $iq({to: this.peerjid,
             type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
           action: 'session-info',
           initiator: this.initiator,
           sid: this.sid });
    info.c('ringing', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    this.connection.send(info);
};

JingleSession.prototype.getStats = function (interval) {
    var self = this;
    var recv = {audio: 0, video: 0};
    var lost = {audio: 0, video: 0};
    var lastrecv = {audio: 0, video: 0};
    var lastlost = {audio: 0, video: 0};
    var loss = {audio: 0, video: 0};
    var delta = {audio: 0, video: 0};
    this.statsinterval = window.setInterval(function () {
        if (self && self.peerconnection && self.peerconnection.getStats) {
            self.peerconnection.getStats(function (stats) {
                var results = stats.result();
                // TODO: there are so much statistics you can get from this..
                for (var i = 0; i < results.length; ++i) {
                    if (results[i].type == 'ssrc') {
                        var packetsrecv = results[i].stat('packetsReceived');
                        var packetslost = results[i].stat('packetsLost');
                        if (packetsrecv && packetslost) {
                            packetsrecv = parseInt(packetsrecv, 10);
                            packetslost = parseInt(packetslost, 10);
                            
                            if (results[i].stat('googFrameRateReceived')) {
                                lastlost.video = lost.video;
                                lastrecv.video = recv.video;
                                recv.video = packetsrecv;
                                lost.video = packetslost;
                            } else {
                                lastlost.audio = lost.audio;
                                lastrecv.audio = recv.audio;
                                recv.audio = packetsrecv;
                                lost.audio = packetslost;
                            }
                        }
                    }
                }
                delta.audio = recv.audio - lastrecv.audio;
                delta.video = recv.video - lastrecv.video;
                loss.audio = (delta.audio > 0) ? Math.ceil(100 * (lost.audio - lastlost.audio) / delta.audio) : 0;
                loss.video = (delta.video > 0) ? Math.ceil(100 * (lost.video - lastlost.video) / delta.video) : 0;
                $(document).trigger('packetloss.jingle', [self.sid, loss]);
            });
        }
    }, interval || 3000);
    return this.statsinterval;
};


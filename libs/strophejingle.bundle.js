var Base64=(function(){var keyStr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var obj={encode:function(input){var output="";var chr1,chr2,chr3;var enc1,enc2,enc3,enc4;var i=0;do{chr1=input.charCodeAt(i++);chr2=input.charCodeAt(i++);chr3=input.charCodeAt(i++);enc1=chr1>>2;enc2=((chr1&3)<<4)|(chr2>>4);enc3=((chr2&15)<<2)|(chr3>>6);enc4=chr3&63;if(isNaN(chr2)){enc3=enc4=64}else{if(isNaN(chr3)){enc4=64}}output=output+keyStr.charAt(enc1)+keyStr.charAt(enc2)+keyStr.charAt(enc3)+keyStr.charAt(enc4)}while(i<input.length);return output},decode:function(input){var output="";var chr1,chr2,chr3;var enc1,enc2,enc3,enc4;var i=0;input=input.replace(/[^A-Za-z0-9\+\/\=]/g,"");do{enc1=keyStr.indexOf(input.charAt(i++));enc2=keyStr.indexOf(input.charAt(i++));enc3=keyStr.indexOf(input.charAt(i++));enc4=keyStr.indexOf(input.charAt(i++));chr1=(enc1<<2)|(enc2>>4);chr2=((enc2&15)<<4)|(enc3>>2);chr3=((enc3&3)<<6)|enc4;output=output+String.fromCharCode(chr1);if(enc3!=64){output=output+String.fromCharCode(chr2)}if(enc4!=64){output=output+String.fromCharCode(chr3)}}while(i<input.length);return output}};return obj})();var hexcase=0;var b64pad="=";var chrsz=8;function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length*chrsz))}function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length*chrsz))}function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length*chrsz))}function hex_hmac_sha1(key,data){return binb2hex(core_hmac_sha1(key,data))}function b64_hmac_sha1(key,data){return binb2b64(core_hmac_sha1(key,data))}function str_hmac_sha1(key,data){return binb2str(core_hmac_sha1(key,data))}function sha1_vm_test(){return hex_sha1("abc")=="a9993e364706816aba3e25717850c26c9cd0d89d"}function core_sha1(x,len){x[len>>5]|=128<<(24-len%32);x[((len+64>>9)<<4)+15]=len;var w=new Array(80);var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;var e=-1009589776;var i,j,t,olda,oldb,oldc,oldd,olde;for(i=0;i<x.length;i+=16){olda=a;oldb=b;oldc=c;oldd=d;olde=e;for(j=0;j<80;j++){if(j<16){w[j]=x[i+j]}else{w[j]=rol(w[j-3]^w[j-8]^w[j-14]^w[j-16],1)}t=safe_add(safe_add(rol(a,5),sha1_ft(j,b,c,d)),safe_add(safe_add(e,w[j]),sha1_kt(j)));e=d;d=c;c=rol(b,30);b=a;a=t}a=safe_add(a,olda);b=safe_add(b,oldb);c=safe_add(c,oldc);d=safe_add(d,oldd);e=safe_add(e,olde)}return[a,b,c,d,e]}function sha1_ft(t,b,c,d){if(t<20){return(b&c)|((~b)&d)}if(t<40){return b^c^d}if(t<60){return(b&c)|(b&d)|(c&d)}return b^c^d}function sha1_kt(t){return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514}function core_hmac_sha1(key,data){var bkey=str2binb(key);if(bkey.length>16){bkey=core_sha1(bkey,key.length*chrsz)}var ipad=new Array(16),opad=new Array(16);for(var i=0;i<16;i++){ipad[i]=bkey[i]^909522486;opad[i]=bkey[i]^1549556828}var hash=core_sha1(ipad.concat(str2binb(data)),512+data.length*chrsz);return core_sha1(opad.concat(hash),512+160)}function safe_add(x,y){var lsw=(x&65535)+(y&65535);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&65535)}function rol(num,cnt){return(num<<cnt)|(num>>>(32-cnt))}function str2binb(str){var bin=[];var mask=(1<<chrsz)-1;for(var i=0;i<str.length*chrsz;i+=chrsz){bin[i>>5]|=(str.charCodeAt(i/chrsz)&mask)<<(32-chrsz-i%32)}return bin}function binb2str(bin){var str="";var mask=(1<<chrsz)-1;for(var i=0;i<bin.length*32;i+=chrsz){str+=String.fromCharCode((bin[i>>5]>>>(32-chrsz-i%32))&mask)}return str}function binb2hex(binarray){var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8+4))&15)+hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8))&15)}return str}function binb2b64(binarray){var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var str="";var triplet,j;for(var i=0;i<binarray.length*4;i+=3){triplet=(((binarray[i>>2]>>8*(3-i%4))&255)<<16)|(((binarray[i+1>>2]>>8*(3-(i+1)%4))&255)<<8)|((binarray[i+2>>2]>>8*(3-(i+2)%4))&255);for(j=0;j<4;j++){if(i*8+j*6>binarray.length*32){str+=b64pad}else{str+=tab.charAt((triplet>>6*(3-j))&63)}}}return str}var MD5=(function(){var hexcase=0;var b64pad="";var chrsz=8;var safe_add=function(x,y){var lsw=(x&65535)+(y&65535);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&65535)};var bit_rol=function(num,cnt){return(num<<cnt)|(num>>>(32-cnt))};var str2binl=function(str){var bin=[];var mask=(1<<chrsz)-1;for(var i=0;i<str.length*chrsz;i+=chrsz){bin[i>>5]|=(str.charCodeAt(i/chrsz)&mask)<<(i%32)}return bin};var binl2str=function(bin){var str="";var mask=(1<<chrsz)-1;for(var i=0;i<bin.length*32;i+=chrsz){str+=String.fromCharCode((bin[i>>5]>>>(i%32))&mask)}return str};var binl2hex=function(binarray){var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&15)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&15)}return str};var binl2b64=function(binarray){var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var str="";var triplet,j;for(var i=0;i<binarray.length*4;i+=3){triplet=(((binarray[i>>2]>>8*(i%4))&255)<<16)|(((binarray[i+1>>2]>>8*((i+1)%4))&255)<<8)|((binarray[i+2>>2]>>8*((i+2)%4))&255);for(j=0;j<4;j++){if(i*8+j*6>binarray.length*32){str+=b64pad}else{str+=tab.charAt((triplet>>6*(3-j))&63)}}}return str};var md5_cmn=function(q,a,b,x,s,t){return safe_add(bit_rol(safe_add(safe_add(a,q),safe_add(x,t)),s),b)};var md5_ff=function(a,b,c,d,x,s,t){return md5_cmn((b&c)|((~b)&d),a,b,x,s,t)};var md5_gg=function(a,b,c,d,x,s,t){return md5_cmn((b&d)|(c&(~d)),a,b,x,s,t)};var md5_hh=function(a,b,c,d,x,s,t){return md5_cmn(b^c^d,a,b,x,s,t)};var md5_ii=function(a,b,c,d,x,s,t){return md5_cmn(c^(b|(~d)),a,b,x,s,t)};var core_md5=function(x,len){x[len>>5]|=128<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;var olda,oldb,oldc,oldd;for(var i=0;i<x.length;i+=16){olda=a;oldb=b;oldc=c;oldd=d;a=md5_ff(a,b,c,d,x[i+0],7,-680876936);d=md5_ff(d,a,b,c,x[i+1],12,-389564586);c=md5_ff(c,d,a,b,x[i+2],17,606105819);b=md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=md5_ff(a,b,c,d,x[i+4],7,-176418897);d=md5_ff(d,a,b,c,x[i+5],12,1200080426);c=md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=md5_ff(b,c,d,a,x[i+7],22,-45705983);a=md5_ff(a,b,c,d,x[i+8],7,1770035416);d=md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=md5_ff(c,d,a,b,x[i+10],17,-42063);b=md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=md5_ff(a,b,c,d,x[i+12],7,1804603682);d=md5_ff(d,a,b,c,x[i+13],12,-40341101);c=md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=md5_ff(b,c,d,a,x[i+15],22,1236535329);a=md5_gg(a,b,c,d,x[i+1],5,-165796510);d=md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=md5_gg(c,d,a,b,x[i+11],14,643717713);b=md5_gg(b,c,d,a,x[i+0],20,-373897302);a=md5_gg(a,b,c,d,x[i+5],5,-701558691);d=md5_gg(d,a,b,c,x[i+10],9,38016083);c=md5_gg(c,d,a,b,x[i+15],14,-660478335);b=md5_gg(b,c,d,a,x[i+4],20,-405537848);a=md5_gg(a,b,c,d,x[i+9],5,568446438);d=md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=md5_gg(c,d,a,b,x[i+3],14,-187363961);b=md5_gg(b,c,d,a,x[i+8],20,1163531501);a=md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=md5_gg(d,a,b,c,x[i+2],9,-51403784);c=md5_gg(c,d,a,b,x[i+7],14,1735328473);b=md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=md5_hh(a,b,c,d,x[i+5],4,-378558);d=md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=md5_hh(c,d,a,b,x[i+11],16,1839030562);b=md5_hh(b,c,d,a,x[i+14],23,-35309556);a=md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=md5_hh(d,a,b,c,x[i+4],11,1272893353);c=md5_hh(c,d,a,b,x[i+7],16,-155497632);b=md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=md5_hh(a,b,c,d,x[i+13],4,681279174);d=md5_hh(d,a,b,c,x[i+0],11,-358537222);c=md5_hh(c,d,a,b,x[i+3],16,-722521979);b=md5_hh(b,c,d,a,x[i+6],23,76029189);a=md5_hh(a,b,c,d,x[i+9],4,-640364487);d=md5_hh(d,a,b,c,x[i+12],11,-421815835);c=md5_hh(c,d,a,b,x[i+15],16,530742520);b=md5_hh(b,c,d,a,x[i+2],23,-995338651);a=md5_ii(a,b,c,d,x[i+0],6,-198630844);d=md5_ii(d,a,b,c,x[i+7],10,1126891415);c=md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=md5_ii(b,c,d,a,x[i+5],21,-57434055);a=md5_ii(a,b,c,d,x[i+12],6,1700485571);d=md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=md5_ii(c,d,a,b,x[i+10],15,-1051523);b=md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=md5_ii(a,b,c,d,x[i+8],6,1873313359);d=md5_ii(d,a,b,c,x[i+15],10,-30611744);c=md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=md5_ii(b,c,d,a,x[i+13],21,1309151649);a=md5_ii(a,b,c,d,x[i+4],6,-145523070);d=md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=md5_ii(c,d,a,b,x[i+2],15,718787259);b=md5_ii(b,c,d,a,x[i+9],21,-343485551);a=safe_add(a,olda);b=safe_add(b,oldb);c=safe_add(c,oldc);d=safe_add(d,oldd)}return[a,b,c,d]};var core_hmac_md5=function(key,data){var bkey=str2binl(key);if(bkey.length>16){bkey=core_md5(bkey,key.length*chrsz)}var ipad=new Array(16),opad=new Array(16);for(var i=0;i<16;i++){ipad[i]=bkey[i]^909522486;opad[i]=bkey[i]^1549556828}var hash=core_md5(ipad.concat(str2binl(data)),512+data.length*chrsz);return core_md5(opad.concat(hash),512+128)};var obj={hexdigest:function(s){return binl2hex(core_md5(str2binl(s),s.length*chrsz))},b64digest:function(s){return binl2b64(core_md5(str2binl(s),s.length*chrsz))},hash:function(s){return binl2str(core_md5(str2binl(s),s.length*chrsz))},hmac_hexdigest:function(key,data){return binl2hex(core_hmac_md5(key,data))},hmac_b64digest:function(key,data){return binl2b64(core_hmac_md5(key,data))},hmac_hash:function(key,data){return binl2str(core_hmac_md5(key,data))},test:function(){return MD5.hexdigest("abc")==="900150983cd24fb0d6963f7d28e17f72"}};return obj})();if(!Function.prototype.bind){Function.prototype.bind=function(obj){var func=this;var _slice=Array.prototype.slice;var _concat=Array.prototype.concat;var _args=_slice.call(arguments,1);return function(){return func.apply(obj?obj:this,_concat.call(_args,_slice.call(arguments,0)))}}}if(!Array.prototype.indexOf){Array.prototype.indexOf=function(elt){var len=this.length;var from=Number(arguments[1])||0;from=(from<0)?Math.ceil(from):Math.floor(from);if(from<0){from+=len}for(;from<len;from++){if(from in this&&this[from]===elt){return from}}return -1}}(function(callback){var Strophe;function $build(name,attrs){return new Strophe.Builder(name,attrs)}function $msg(attrs){return new Strophe.Builder("message",attrs)}function $iq(attrs){return new Strophe.Builder("iq",attrs)}function $pres(attrs){return new Strophe.Builder("presence",attrs)}Strophe={VERSION:"1.1.0",NS:{HTTPBIND:"http://jabber.org/protocol/httpbind",BOSH:"urn:xmpp:xbosh",CLIENT:"jabber:client",AUTH:"jabber:iq:auth",ROSTER:"jabber:iq:roster",PROFILE:"jabber:iq:profile",DISCO_INFO:"http://jabber.org/protocol/disco#info",DISCO_ITEMS:"http://jabber.org/protocol/disco#items",MUC:"http://jabber.org/protocol/muc",SASL:"urn:ietf:params:xml:ns:xmpp-sasl",STREAM:"http://etherx.jabber.org/streams",BIND:"urn:ietf:params:xml:ns:xmpp-bind",SESSION:"urn:ietf:params:xml:ns:xmpp-session",VERSION:"jabber:iq:version",STANZAS:"urn:ietf:params:xml:ns:xmpp-stanzas",XHTML_IM:"http://jabber.org/protocol/xhtml-im",XHTML:"http://www.w3.org/1999/xhtml"},XHTML:{tags:["a","blockquote","br","cite","em","img","li","ol","p","span","strong","ul","body"],attributes:{a:["href"],blockquote:["style"],br:[],cite:["style"],em:[],img:["src","alt","style","height","width"],li:["style"],ol:["style"],p:["style"],span:["style"],strong:[],ul:["style"],body:[]},css:["background-color","color","font-family","font-size","font-style","font-weight","margin-left","margin-right","text-align","text-decoration"],validTag:function(tag){for(var i=0;i<Strophe.XHTML.tags.length;i++){if(tag==Strophe.XHTML.tags[i]){return true}}return false},validAttribute:function(tag,attribute){if(typeof Strophe.XHTML.attributes[tag]!=="undefined"&&Strophe.XHTML.attributes[tag].length>0){for(var i=0;i<Strophe.XHTML.attributes[tag].length;i++){if(attribute==Strophe.XHTML.attributes[tag][i]){return true}}}return false},validCSS:function(style){for(var i=0;i<Strophe.XHTML.css.length;i++){if(style==Strophe.XHTML.css[i]){return true}}return false}},Status:{ERROR:0,CONNECTING:1,CONNFAIL:2,AUTHENTICATING:3,AUTHFAIL:4,CONNECTED:5,DISCONNECTED:6,DISCONNECTING:7,ATTACHED:8},LogLevel:{DEBUG:0,INFO:1,WARN:2,ERROR:3,FATAL:4},ElementType:{NORMAL:1,TEXT:3,CDATA:4,FRAGMENT:11},TIMEOUT:1.1,SECONDARY_TIMEOUT:0.1,addNamespace:function(name,value){Strophe.NS[name]=value},forEachChild:function(elem,elemName,func){var i,childNode;for(i=0;i<elem.childNodes.length;i++){childNode=elem.childNodes[i];if(childNode.nodeType==Strophe.ElementType.NORMAL&&(!elemName||this.isTagEqual(childNode,elemName))){func(childNode)}}},isTagEqual:function(el,name){return el.tagName.toLowerCase()==name.toLowerCase()},_xmlGenerator:null,_makeGenerator:function(){var doc;if(document.implementation.createDocument===undefined||document.implementation.createDocument&&document.documentMode&&document.documentMode<10){doc=this._getIEXmlDom();doc.appendChild(doc.createElement("strophe"))}else{doc=document.implementation.createDocument("jabber:client","strophe",null)}return doc},xmlGenerator:function(){if(!Strophe._xmlGenerator){Strophe._xmlGenerator=Strophe._makeGenerator()}return Strophe._xmlGenerator},_getIEXmlDom:function(){var doc=null;var docStrings=["Msxml2.DOMDocument.6.0","Msxml2.DOMDocument.5.0","Msxml2.DOMDocument.4.0","MSXML2.DOMDocument.3.0","MSXML2.DOMDocument","MSXML.DOMDocument","Microsoft.XMLDOM"];for(var d=0;d<docStrings.length;d++){if(doc===null){try{doc=new ActiveXObject(docStrings[d])}catch(e){doc=null}}else{break}}return doc},xmlElement:function(name){if(!name){return null}var node=Strophe.xmlGenerator().createElement(name);var a,i,k;for(a=1;a<arguments.length;a++){if(!arguments[a]){continue}if(typeof(arguments[a])=="string"||typeof(arguments[a])=="number"){node.appendChild(Strophe.xmlTextNode(arguments[a]))}else{if(typeof(arguments[a])=="object"&&typeof(arguments[a].sort)=="function"){for(i=0;i<arguments[a].length;i++){if(typeof(arguments[a][i])=="object"&&typeof(arguments[a][i].sort)=="function"){node.setAttribute(arguments[a][i][0],arguments[a][i][1])}}}else{if(typeof(arguments[a])=="object"){for(k in arguments[a]){if(arguments[a].hasOwnProperty(k)){node.setAttribute(k,arguments[a][k])}}}}}}return node},xmlescape:function(text){text=text.replace(/\&/g,"&amp;");text=text.replace(/</g,"&lt;");text=text.replace(/>/g,"&gt;");text=text.replace(/'/g,"&apos;");text=text.replace(/"/g,"&quot;");return text},xmlTextNode:function(text){return Strophe.xmlGenerator().createTextNode(text)},xmlHtmlNode:function(html){if(window.DOMParser){parser=new DOMParser();node=parser.parseFromString(html,"text/xml")}else{node=new ActiveXObject("Microsoft.XMLDOM");node.async="false";node.loadXML(html)}return node},getText:function(elem){if(!elem){return null}var str="";if(elem.childNodes.length===0&&elem.nodeType==Strophe.ElementType.TEXT){str+=elem.nodeValue}for(var i=0;i<elem.childNodes.length;i++){if(elem.childNodes[i].nodeType==Strophe.ElementType.TEXT){str+=elem.childNodes[i].nodeValue}}return Strophe.xmlescape(str)},copyElement:function(elem){var i,el;if(elem.nodeType==Strophe.ElementType.NORMAL){el=Strophe.xmlElement(elem.tagName);for(i=0;i<elem.attributes.length;i++){el.setAttribute(elem.attributes[i].nodeName.toLowerCase(),elem.attributes[i].value)}for(i=0;i<elem.childNodes.length;i++){el.appendChild(Strophe.copyElement(elem.childNodes[i]))}}else{if(elem.nodeType==Strophe.ElementType.TEXT){el=Strophe.xmlGenerator().createTextNode(elem.nodeValue)}}return el},createHtml:function(elem){var i,el,j,tag,attribute,value,css,cssAttrs,attr,cssName,cssValue,children,child;if(elem.nodeType==Strophe.ElementType.NORMAL){tag=elem.nodeName.toLowerCase();if(Strophe.XHTML.validTag(tag)){try{el=Strophe.xmlElement(tag);for(i=0;i<Strophe.XHTML.attributes[tag].length;i++){attribute=Strophe.XHTML.attributes[tag][i];value=elem.getAttribute(attribute);if(typeof value=="undefined"||value===null||value===""||value===false||value===0){continue}if(attribute=="style"&&typeof value=="object"){if(typeof value.cssText!="undefined"){value=value.cssText}}if(attribute=="style"){css=[];cssAttrs=value.split(";");for(j=0;j<cssAttrs.length;j++){attr=cssAttrs[j].split(":");cssName=attr[0].replace(/^\s*/,"").replace(/\s*$/,"").toLowerCase();if(Strophe.XHTML.validCSS(cssName)){cssValue=attr[1].replace(/^\s*/,"").replace(/\s*$/,"");css.push(cssName+": "+cssValue)}}if(css.length>0){value=css.join("; ");el.setAttribute(attribute,value)}}else{el.setAttribute(attribute,value)}}for(i=0;i<elem.childNodes.length;i++){el.appendChild(Strophe.createHtml(elem.childNodes[i]))}}catch(e){el=Strophe.xmlTextNode("")}}else{el=Strophe.xmlGenerator().createDocumentFragment();for(i=0;i<elem.childNodes.length;i++){el.appendChild(Strophe.createHtml(elem.childNodes[i]))}}}else{if(elem.nodeType==Strophe.ElementType.FRAGMENT){el=Strophe.xmlGenerator().createDocumentFragment();for(i=0;i<elem.childNodes.length;i++){el.appendChild(Strophe.createHtml(elem.childNodes[i]))}}else{if(elem.nodeType==Strophe.ElementType.TEXT){el=Strophe.xmlTextNode(elem.nodeValue)}}}return el},escapeNode:function(node){return node.replace(/^\s+|\s+$/g,"").replace(/\\/g,"\\5c").replace(/ /g,"\\20").replace(/\"/g,"\\22").replace(/\&/g,"\\26").replace(/\'/g,"\\27").replace(/\//g,"\\2f").replace(/:/g,"\\3a").replace(/</g,"\\3c").replace(/>/g,"\\3e").replace(/@/g,"\\40")},unescapeNode:function(node){return node.replace(/\\20/g," ").replace(/\\22/g,'"').replace(/\\26/g,"&").replace(/\\27/g,"'").replace(/\\2f/g,"/").replace(/\\3a/g,":").replace(/\\3c/g,"<").replace(/\\3e/g,">").replace(/\\40/g,"@").replace(/\\5c/g,"\\")},getNodeFromJid:function(jid){if(jid.indexOf("@")<0){return null}return jid.split("@")[0]},getDomainFromJid:function(jid){var bare=Strophe.getBareJidFromJid(jid);if(bare.indexOf("@")<0){return bare}else{var parts=bare.split("@");parts.splice(0,1);return parts.join("@")}},getResourceFromJid:function(jid){var s=jid.split("/");if(s.length<2){return null}s.splice(0,1);return s.join("/")},getBareJidFromJid:function(jid){return jid?jid.split("/")[0]:null},log:function(level,msg){return},debug:function(msg){this.log(this.LogLevel.DEBUG,msg)},info:function(msg){this.log(this.LogLevel.INFO,msg)},warn:function(msg){this.log(this.LogLevel.WARN,msg)},error:function(msg){this.log(this.LogLevel.ERROR,msg)},fatal:function(msg){this.log(this.LogLevel.FATAL,msg)},serialize:function(elem){var result;if(!elem){return null}if(typeof(elem.tree)==="function"){elem=elem.tree()}var nodeName=elem.nodeName;var i,child;if(elem.getAttribute("_realname")){nodeName=elem.getAttribute("_realname")}result="<"+nodeName;for(i=0;i<elem.attributes.length;i++){if(elem.attributes[i].nodeName!="_realname"){result+=" "+elem.attributes[i].nodeName.toLowerCase()+"='"+elem.attributes[i].value.replace(/&/g,"&amp;").replace(/\'/g,"&apos;").replace(/>/g,"&gt;").replace(/</g,"&lt;")+"'"}}if(elem.childNodes.length>0){result+=">";for(i=0;i<elem.childNodes.length;i++){child=elem.childNodes[i];switch(child.nodeType){case Strophe.ElementType.NORMAL:result+=Strophe.serialize(child);break;case Strophe.ElementType.TEXT:result+=Strophe.xmlescape(child.nodeValue);break;case Strophe.ElementType.CDATA:result+="<![CDATA["+child.nodeValue+"]]>"}}result+="</"+nodeName+">"}else{result+="/>"}return result},_requestId:0,_connectionPlugins:{},addConnectionPlugin:function(name,ptype){Strophe._connectionPlugins[name]=ptype}};Strophe.Builder=function(name,attrs){if(name=="presence"||name=="message"||name=="iq"){if(attrs&&!attrs.xmlns){attrs.xmlns=Strophe.NS.CLIENT}else{if(!attrs){attrs={xmlns:Strophe.NS.CLIENT}}}}this.nodeTree=Strophe.xmlElement(name,attrs);this.node=this.nodeTree};Strophe.Builder.prototype={tree:function(){return this.nodeTree},toString:function(){return Strophe.serialize(this.nodeTree)},up:function(){this.node=this.node.parentNode;return this},attrs:function(moreattrs){for(var k in moreattrs){if(moreattrs.hasOwnProperty(k)){this.node.setAttribute(k,moreattrs[k])}}return this},c:function(name,attrs,text){var child=Strophe.xmlElement(name,attrs,text);this.node.appendChild(child);if(!text){this.node=child}return this},cnode:function(elem){var impNode;var xmlGen=Strophe.xmlGenerator();try{impNode=(xmlGen.importNode!==undefined)}catch(e){impNode=false}var newElem=impNode?xmlGen.importNode(elem,true):Strophe.copyElement(elem);this.node.appendChild(newElem);this.node=newElem;return this},t:function(text){var child=Strophe.xmlTextNode(text);this.node.appendChild(child);return this},h:function(html){var fragment=document.createElement("body");fragment.innerHTML=html;var xhtml=Strophe.createHtml(fragment);while(xhtml.childNodes.length>0){this.node.appendChild(xhtml.childNodes[0])}return this}};Strophe.Handler=function(handler,ns,name,type,id,from,options){this.handler=handler;this.ns=ns;this.name=name;this.type=type;this.id=id;this.options=options||{matchBare:false};if(!this.options.matchBare){this.options.matchBare=false}if(this.options.matchBare){this.from=from?Strophe.getBareJidFromJid(from):null}else{this.from=from}this.user=true};Strophe.Handler.prototype={isMatch:function(elem){var nsMatch;var from=null;if(this.options.matchBare){from=Strophe.getBareJidFromJid(elem.getAttribute("from"))}else{from=elem.getAttribute("from")}nsMatch=false;if(!this.ns){nsMatch=true}else{var that=this;Strophe.forEachChild(elem,null,function(elem){if(elem.getAttribute("xmlns")==that.ns){nsMatch=true}});nsMatch=nsMatch||elem.getAttribute("xmlns")==this.ns}if(nsMatch&&(!this.name||Strophe.isTagEqual(elem,this.name))&&(!this.type||elem.getAttribute("type")==this.type)&&(!this.id||elem.getAttribute("id")==this.id)&&(!this.from||from==this.from)){return true}return false},run:function(elem){var result=null;try{result=this.handler(elem)}catch(e){if(e.sourceURL){Strophe.fatal("error: "+this.handler+" "+e.sourceURL+":"+e.line+" - "+e.name+": "+e.message)}else{if(e.fileName){if(typeof(console)!="undefined"){console.trace();console.error(this.handler," - error - ",e,e.message)}Strophe.fatal("error: "+this.handler+" "+e.fileName+":"+e.lineNumber+" - "+e.name+": "+e.message)}else{Strophe.fatal("error: "+e.message+"\n"+e.stack)}}throw e}return result},toString:function(){return"{Handler: "+this.handler+"("+this.name+","+this.id+","+this.ns+")}"}};Strophe.TimedHandler=function(period,handler){this.period=period;this.handler=handler;this.lastCalled=new Date().getTime();this.user=true};Strophe.TimedHandler.prototype={run:function(){this.lastCalled=new Date().getTime();return this.handler()},reset:function(){this.lastCalled=new Date().getTime()},toString:function(){return"{TimedHandler: "+this.handler+"("+this.period+")}"}};Strophe.Connection=function(service,options){this.service=service;this._options=options||{};var proto=this._options.protocol||"";if(service.indexOf("ws:")===0||service.indexOf("wss:")===0||proto.indexOf("ws")===0){this._proto=new Strophe.Websocket(this)}else{this._proto=new Strophe.Bosh(this)}this.jid="";this.domain=null;this.features=null;this._sasl_data={};this.do_session=false;this.do_bind=false;this.timedHandlers=[];this.handlers=[];this.removeTimeds=[];this.removeHandlers=[];this.addTimeds=[];this.addHandlers=[];this._authentication={};this._idleTimeout=null;this._disconnectTimeout=null;this.do_authentication=true;this.authenticated=false;this.disconnecting=false;this.connected=false;this.errors=0;this.paused=false;this._data=[];this._uniqueId=0;this._sasl_success_handler=null;this._sasl_failure_handler=null;this._sasl_challenge_handler=null;this.maxRetries=5;this._idleTimeout=setTimeout(this._onIdle.bind(this),100);for(var k in Strophe._connectionPlugins){if(Strophe._connectionPlugins.hasOwnProperty(k)){var ptype=Strophe._connectionPlugins[k];var F=function(){};F.prototype=ptype;this[k]=new F();this[k].init(this)}}};Strophe.Connection.prototype={reset:function(){this._proto._reset();this.do_session=false;this.do_bind=false;this.timedHandlers=[];this.handlers=[];this.removeTimeds=[];this.removeHandlers=[];this.addTimeds=[];this.addHandlers=[];this._authentication={};this.authenticated=false;this.disconnecting=false;this.connected=false;this.errors=0;this._requests=[];this._uniqueId=0},pause:function(){this.paused=true},resume:function(){this.paused=false},getUniqueId:function(suffix){if(typeof(suffix)=="string"||typeof(suffix)=="number"){return ++this._uniqueId+":"+suffix}else{return ++this._uniqueId+""}},connect:function(jid,pass,callback,wait,hold,route){this.jid=jid;this.authzid=Strophe.getBareJidFromJid(this.jid);this.authcid=Strophe.getNodeFromJid(this.jid);this.pass=pass;this.servtype="xmpp";this.connect_callback=callback;this.disconnecting=false;this.connected=false;this.authenticated=false;this.errors=0;this.domain=this.domain||Strophe.getDomainFromJid(this.jid);this._changeConnectStatus(Strophe.Status.CONNECTING,null);this._proto._connect(wait,hold,route)},attach:function(jid,sid,rid,callback,wait,hold,wind){this._proto.attach(jid,sid,rid,callback,wait,hold,wind)},xmlInput:function(elem){return},xmlOutput:function(elem){return},rawInput:function(data){return},rawOutput:function(data){return},send:function(elem){if(elem===null){return}if(typeof(elem.sort)==="function"){for(var i=0;i<elem.length;i++){this._queueData(elem[i])}}else{if(typeof(elem.tree)==="function"){this._queueData(elem.tree())}else{this._queueData(elem)}}this._proto._send()},flush:function(){clearTimeout(this._idleTimeout);this._onIdle()},sendIQ:function(elem,callback,errback,timeout){var timeoutHandler=null;var that=this;if(typeof(elem.tree)==="function"){elem=elem.tree()}var id=elem.getAttribute("id");if(!id){id=this.getUniqueId("sendIQ");elem.setAttribute("id",id)}var handler=this.addHandler(function(stanza){if(timeoutHandler){that.deleteTimedHandler(timeoutHandler)}var iqtype=stanza.getAttribute("type");if(iqtype=="result"){if(callback){callback(stanza)}}else{if(iqtype=="error"){if(errback){errback(stanza)}}else{throw {name:"StropheError",message:"Got bad IQ type of "+iqtype}}}},null,"iq",null,id);if(timeout){timeoutHandler=this.addTimedHandler(timeout,function(){that.deleteHandler(handler);if(errback){errback(null)}return false})}this.send(elem);return id},_queueData:function(element){if(element===null||!element.tagName||!element.childNodes){throw {name:"StropheError",message:"Cannot queue non-DOMElement."}}this._data.push(element)},_sendRestart:function(){this._data.push("restart");this._proto._sendRestart();this._idleTimeout=setTimeout(this._onIdle.bind(this),100)},addTimedHandler:function(period,handler){var thand=new Strophe.TimedHandler(period,handler);this.addTimeds.push(thand);return thand},deleteTimedHandler:function(handRef){this.removeTimeds.push(handRef)},addHandler:function(handler,ns,name,type,id,from,options){var hand=new Strophe.Handler(handler,ns,name,type,id,from,options);this.addHandlers.push(hand);return hand},deleteHandler:function(handRef){this.removeHandlers.push(handRef)},disconnect:function(reason){this._changeConnectStatus(Strophe.Status.DISCONNECTING,reason);Strophe.info("Disconnect was called because: "+reason);if(this.connected){var pres=false;this.disconnecting=true;if(this.authenticated){pres=$pres({xmlns:Strophe.NS.CLIENT,type:"unavailable"})}this._disconnectTimeout=this._addSysTimedHandler(3000,this._onDisconnectTimeout.bind(this));this._proto._disconnect(pres)}},_changeConnectStatus:function(status,condition){for(var k in Strophe._connectionPlugins){if(Strophe._connectionPlugins.hasOwnProperty(k)){var plugin=this[k];if(plugin.statusChanged){try{plugin.statusChanged(status,condition)}catch(err){Strophe.error(""+k+" plugin caused an exception changing status: "+err)}}}}if(this.connect_callback){try{this.connect_callback(status,condition)}catch(e){Strophe.error("User connection callback caused an exception: "+e)}}},_doDisconnect:function(){if(this._disconnectTimeout!==null){this.deleteTimedHandler(this._disconnectTimeout);this._disconnectTimeout=null}Strophe.info("_doDisconnect was called");this._proto._doDisconnect();this.authenticated=false;this.disconnecting=false;this.handlers=[];this.timedHandlers=[];this.removeTimeds=[];this.removeHandlers=[];this.addTimeds=[];this.addHandlers=[];this._changeConnectStatus(Strophe.Status.DISCONNECTED,null);this.connected=false},_dataRecv:function(req,raw){Strophe.info("_dataRecv called");var elem=this._proto._reqToData(req);if(elem===null){return}if(this.xmlInput!==Strophe.Connection.prototype.xmlInput){if(elem.nodeName===this._proto.strip&&elem.childNodes.length){this.xmlInput(elem.childNodes[0])}else{this.xmlInput(elem)}}if(this.rawInput!==Strophe.Connection.prototype.rawInput){if(raw){this.rawInput(raw)}else{this.rawInput(Strophe.serialize(elem))}}var i,hand;while(this.removeHandlers.length>0){hand=this.removeHandlers.pop();i=this.handlers.indexOf(hand);if(i>=0){this.handlers.splice(i,1)}}while(this.addHandlers.length>0){this.handlers.push(this.addHandlers.pop())}if(this.disconnecting&&this._proto._emptyQueue()){this._doDisconnect();return}var typ=elem.getAttribute("type");var cond,conflict;if(typ!==null&&typ=="terminate"){if(this.disconnecting){return}cond=elem.getAttribute("condition");conflict=elem.getElementsByTagName("conflict");if(cond!==null){if(cond=="remote-stream-error"&&conflict.length>0){cond="conflict"}this._changeConnectStatus(Strophe.Status.CONNFAIL,cond)}else{this._changeConnectStatus(Strophe.Status.CONNFAIL,"unknown")}this.disconnect("unknown stream-error");return}var that=this;Strophe.forEachChild(elem,null,function(child){var i,newList;newList=that.handlers;that.handlers=[];for(i=0;i<newList.length;i++){var hand=newList[i];try{if(hand.isMatch(child)&&(that.authenticated||!hand.user)){if(hand.run(child)){that.handlers.push(hand)}}else{that.handlers.push(hand)}}catch(e){Strophe.warn("Removing Strophe handlers due to uncaught exception: "+e.message)}}})},mechanisms:{},_connect_cb:function(req,_callback,raw){Strophe.info("_connect_cb was called");this.connected=true;var bodyWrap=this._proto._reqToData(req);if(!bodyWrap){return}if(this.xmlInput!==Strophe.Connection.prototype.xmlInput){if(bodyWrap.nodeName===this._proto.strip&&bodyWrap.childNodes.length){this.xmlInput(bodyWrap.childNodes[0])}else{this.xmlInput(bodyWrap)}}if(this.rawInput!==Strophe.Connection.prototype.rawInput){if(raw){this.rawInput(raw)}else{this.rawInput(Strophe.serialize(bodyWrap))}}var conncheck=this._proto._connect_cb(bodyWrap);if(conncheck===Strophe.Status.CONNFAIL){return}this._authentication.sasl_scram_sha1=false;this._authentication.sasl_plain=false;this._authentication.sasl_digest_md5=false;this._authentication.sasl_anonymous=false;this._authentication.legacy_auth=false;var hasFeatures=bodyWrap.getElementsByTagName("stream:features").length>0;if(!hasFeatures){hasFeatures=bodyWrap.getElementsByTagName("features").length>0}var mechanisms=bodyWrap.getElementsByTagName("mechanism");var matched=[];var i,mech,auth_str,hashed_auth_str,found_authentication=false;if(!hasFeatures){this._proto._no_auth_received(_callback);return}if(mechanisms.length>0){for(i=0;i<mechanisms.length;i++){mech=Strophe.getText(mechanisms[i]);if(this.mechanisms[mech]){matched.push(this.mechanisms[mech])}}}this._authentication.legacy_auth=bodyWrap.getElementsByTagName("auth").length>0;found_authentication=this._authentication.legacy_auth||matched.length>0;if(!found_authentication){this._proto._no_auth_received(_callback);return}if(this.do_authentication!==false){this.authenticate(matched)}},authenticate:function(matched){var i;for(i=0;i<matched.length-1;++i){var higher=i;for(var j=i+1;j<matched.length;++j){if(matched[j].prototype.priority>matched[higher].prototype.priority){higher=j}}if(higher!=i){var swap=matched[i];matched[i]=matched[higher];matched[higher]=swap}}var mechanism_found=false;for(i=0;i<matched.length;++i){if(!matched[i].test(this)){continue}this._sasl_success_handler=this._addSysHandler(this._sasl_success_cb.bind(this),null,"success",null,null);this._sasl_failure_handler=this._addSysHandler(this._sasl_failure_cb.bind(this),null,"failure",null,null);this._sasl_challenge_handler=this._addSysHandler(this._sasl_challenge_cb.bind(this),null,"challenge",null,null);this._sasl_mechanism=new matched[i]();this._sasl_mechanism.onStart(this);var request_auth_exchange=$build("auth",{xmlns:Strophe.NS.SASL,mechanism:this._sasl_mechanism.name});if(this._sasl_mechanism.isClientFirst){var response=this._sasl_mechanism.onChallenge(this,null);request_auth_exchange.t(Base64.encode(response))}this.send(request_auth_exchange.tree());mechanism_found=true;break}if(!mechanism_found){if(Strophe.getNodeFromJid(this.jid)===null){this._changeConnectStatus(Strophe.Status.CONNFAIL,"x-strophe-bad-non-anon-jid");this.disconnect("x-strophe-bad-non-anon-jid")}else{this._changeConnectStatus(Strophe.Status.AUTHENTICATING,null);this._addSysHandler(this._auth1_cb.bind(this),null,null,null,"_auth_1");this.send($iq({type:"get",to:this.domain,id:"_auth_1"}).c("query",{xmlns:Strophe.NS.AUTH}).c("username",{}).t(Strophe.getNodeFromJid(this.jid)).tree())}}},_sasl_challenge_cb:function(elem){var challenge=Base64.decode(Strophe.getText(elem));var response=this._sasl_mechanism.onChallenge(this,challenge);var stanza=$build("response",{xmlns:Strophe.NS.SASL});if(response!==""){stanza.t(Base64.encode(response))}this.send(stanza.tree());return true},_auth1_cb:function(elem){var iq=$iq({type:"set",id:"_auth_2"}).c("query",{xmlns:Strophe.NS.AUTH}).c("username",{}).t(Strophe.getNodeFromJid(this.jid)).up().c("password").t(this.pass);if(!Strophe.getResourceFromJid(this.jid)){this.jid=Strophe.getBareJidFromJid(this.jid)+"/strophe"}iq.up().c("resource",{}).t(Strophe.getResourceFromJid(this.jid));this._addSysHandler(this._auth2_cb.bind(this),null,null,null,"_auth_2");this.send(iq.tree());return false},_sasl_success_cb:function(elem){if(this._sasl_data["server-signature"]){var serverSignature;var success=Base64.decode(Strophe.getText(elem));var attribMatch=/([a-z]+)=([^,]+)(,|$)/;matches=success.match(attribMatch);if(matches[1]=="v"){serverSignature=matches[2]}if(serverSignature!=this._sasl_data["server-signature"]){this.deleteHandler(this._sasl_failure_handler);this._sasl_failure_handler=null;if(this._sasl_challenge_handler){this.deleteHandler(this._sasl_challenge_handler);this._sasl_challenge_handler=null}this._sasl_data={};return this._sasl_failure_cb(null)}}Strophe.info("SASL authentication succeeded.");if(this._sasl_mechanism){this._sasl_mechanism.onSuccess()}this.deleteHandler(this._sasl_failure_handler);this._sasl_failure_handler=null;if(this._sasl_challenge_handler){this.deleteHandler(this._sasl_challenge_handler);this._sasl_challenge_handler=null}this._addSysHandler(this._sasl_auth1_cb.bind(this),null,"stream:features",null,null);this._sendRestart();return false},_sasl_auth1_cb:function(elem){this.features=elem;var i,child;for(i=0;i<elem.childNodes.length;i++){child=elem.childNodes[i];if(child.nodeName=="bind"){this.do_bind=true}if(child.nodeName=="session"){this.do_session=true}}if(!this.do_bind){this._changeConnectStatus(Strophe.Status.AUTHFAIL,null);return false}else{this._addSysHandler(this._sasl_bind_cb.bind(this),null,null,null,"_bind_auth_2");var resource=Strophe.getResourceFromJid(this.jid);if(resource){this.send($iq({type:"set",id:"_bind_auth_2"}).c("bind",{xmlns:Strophe.NS.BIND}).c("resource",{}).t(resource).tree())}else{this.send($iq({type:"set",id:"_bind_auth_2"}).c("bind",{xmlns:Strophe.NS.BIND}).tree())}}return false},_sasl_bind_cb:function(elem){if(elem.getAttribute("type")=="error"){Strophe.info("SASL binding failed.");var conflict=elem.getElementsByTagName("conflict"),condition;if(conflict.length>0){condition="conflict"}this._changeConnectStatus(Strophe.Status.AUTHFAIL,condition);return false}var bind=elem.getElementsByTagName("bind");var jidNode;if(bind.length>0){jidNode=bind[0].getElementsByTagName("jid");if(jidNode.length>0){this.jid=Strophe.getText(jidNode[0]);if(this.do_session){this._addSysHandler(this._sasl_session_cb.bind(this),null,null,null,"_session_auth_2");this.send($iq({type:"set",id:"_session_auth_2"}).c("session",{xmlns:Strophe.NS.SESSION}).tree())}else{this.authenticated=true;this._changeConnectStatus(Strophe.Status.CONNECTED,null)}}}else{Strophe.info("SASL binding failed.");this._changeConnectStatus(Strophe.Status.AUTHFAIL,null);return false}},_sasl_session_cb:function(elem){if(elem.getAttribute("type")=="result"){this.authenticated=true;this._changeConnectStatus(Strophe.Status.CONNECTED,null)}else{if(elem.getAttribute("type")=="error"){Strophe.info("Session creation failed.");this._changeConnectStatus(Strophe.Status.AUTHFAIL,null);return false}}return false},_sasl_failure_cb:function(elem){if(this._sasl_success_handler){this.deleteHandler(this._sasl_success_handler);this._sasl_success_handler=null}if(this._sasl_challenge_handler){this.deleteHandler(this._sasl_challenge_handler);this._sasl_challenge_handler=null}if(this._sasl_mechanism){this._sasl_mechanism.onFailure()}this._changeConnectStatus(Strophe.Status.AUTHFAIL,null);return false},_auth2_cb:function(elem){if(elem.getAttribute("type")=="result"){this.authenticated=true;this._changeConnectStatus(Strophe.Status.CONNECTED,null)}else{if(elem.getAttribute("type")=="error"){this._changeConnectStatus(Strophe.Status.AUTHFAIL,null);this.disconnect("authentication failed")}}return false},_addSysTimedHandler:function(period,handler){var thand=new Strophe.TimedHandler(period,handler);thand.user=false;this.addTimeds.push(thand);return thand},_addSysHandler:function(handler,ns,name,type,id){var hand=new Strophe.Handler(handler,ns,name,type,id);hand.user=false;this.addHandlers.push(hand);return hand},_onDisconnectTimeout:function(){Strophe.info("_onDisconnectTimeout was called");this._proto._onDisconnectTimeout();this._doDisconnect();return false},_onIdle:function(){var i,thand,since,newList;while(this.addTimeds.length>0){this.timedHandlers.push(this.addTimeds.pop())}while(this.removeTimeds.length>0){thand=this.removeTimeds.pop();i=this.timedHandlers.indexOf(thand);if(i>=0){this.timedHandlers.splice(i,1)}}var now=new Date().getTime();newList=[];for(i=0;i<this.timedHandlers.length;i++){thand=this.timedHandlers[i];if(this.authenticated||!thand.user){since=thand.lastCalled+thand.period;if(since-now<=0){if(thand.run()){newList.push(thand)}}else{newList.push(thand)}}}this.timedHandlers=newList;var body,time_elapsed;clearTimeout(this._idleTimeout);this._proto._onIdle();if(this.connected){this._idleTimeout=setTimeout(this._onIdle.bind(this),100)}}};if(callback){callback(Strophe,$build,$msg,$iq,$pres)}Strophe.SASLMechanism=function(name,isClientFirst,priority){this.name=name;this.isClientFirst=isClientFirst;this.priority=priority};Strophe.SASLMechanism.prototype={_sasl_data:{},test:function(connection){return true},onStart:function(connection){this._connection=connection},onChallenge:function(connection,challenge){throw new Error("You should implement challenge handling!")},onFailure:function(){this._connection=null},onSuccess:function(){this._connection=null}};Strophe.SASLAnonymous=function(){};Strophe.SASLAnonymous.prototype=new Strophe.SASLMechanism("ANONYMOUS",false,10);Strophe.SASLAnonymous.test=function(connection){return connection.authcid===null};Strophe.Connection.prototype.mechanisms[Strophe.SASLAnonymous.prototype.name]=Strophe.SASLAnonymous;Strophe.SASLPlain=function(){};Strophe.SASLPlain.prototype=new Strophe.SASLMechanism("PLAIN",true,20);Strophe.SASLPlain.test=function(connection){return connection.authcid!==null};Strophe.SASLPlain.prototype.onChallenge=function(connection,challenge){var auth_str=connection.authzid;auth_str=auth_str+"\u0000";auth_str=auth_str+connection.authcid;auth_str=auth_str+"\u0000";auth_str=auth_str+connection.pass;return auth_str};Strophe.Connection.prototype.mechanisms[Strophe.SASLPlain.prototype.name]=Strophe.SASLPlain;Strophe.SASLSHA1=function(){};Strophe.SASLSHA1.prototype=new Strophe.SASLMechanism("SCRAM-SHA-1",true,40);Strophe.SASLSHA1.test=function(connection){return connection.authcid!==null};Strophe.SASLSHA1.prototype.onChallenge=function(connection,challenge,test_cnonce){var cnonce=test_cnonce||MD5.hexdigest(Math.random()*1234567890);var auth_str="n="+connection.authcid;auth_str+=",r=";auth_str+=cnonce;this._sasl_data.cnonce=cnonce;this._sasl_data["client-first-message-bare"]=auth_str;auth_str="n,,"+auth_str;this.onChallenge=function(connection,challenge){var nonce,salt,iter,Hi,U,U_old;var clientKey,serverKey,clientSignature;var responseText="c=biws,";var authMessage=this._sasl_data["client-first-message-bare"]+","+challenge+",";var cnonce=this._sasl_data.cnonce;var attribMatch=/([a-z]+)=([^,]+)(,|$)/;while(challenge.match(attribMatch)){matches=challenge.match(attribMatch);challenge=challenge.replace(matches[0],"");switch(matches[1]){case"r":nonce=matches[2];break;case"s":salt=matches[2];break;case"i":iter=matches[2];break}}if(nonce.substr(0,cnonce.length)!==cnonce){this._sasl_data={};return connection._sasl_failure_cb()}responseText+="r="+nonce;authMessage+=responseText;salt=Base64.decode(salt);salt+="\x00\x00\x00\x01";Hi=U_old=core_hmac_sha1(connection.pass,salt);for(i=1;i<iter;i++){U=core_hmac_sha1(connection.pass,binb2str(U_old));for(k=0;k<5;k++){Hi[k]^=U[k]}U_old=U}Hi=binb2str(Hi);clientKey=core_hmac_sha1(Hi,"Client Key");serverKey=str_hmac_sha1(Hi,"Server Key");clientSignature=core_hmac_sha1(str_sha1(binb2str(clientKey)),authMessage);connection._sasl_data["server-signature"]=b64_hmac_sha1(serverKey,authMessage);for(k=0;k<5;k++){clientKey[k]^=clientSignature[k]}responseText+=",p="+Base64.encode(binb2str(clientKey));return responseText}.bind(this);return auth_str};Strophe.Connection.prototype.mechanisms[Strophe.SASLSHA1.prototype.name]=Strophe.SASLSHA1;Strophe.SASLMD5=function(){};Strophe.SASLMD5.prototype=new Strophe.SASLMechanism("DIGEST-MD5",false,30);Strophe.SASLMD5.test=function(connection){return connection.authcid!==null};Strophe.SASLMD5.prototype._quote=function(str){return'"'+str.replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"'};Strophe.SASLMD5.prototype.onChallenge=function(connection,challenge,test_cnonce){var attribMatch=/([a-z]+)=("[^"]+"|[^,"]+)(?:,|$)/;var cnonce=test_cnonce||MD5.hexdigest(""+(Math.random()*1234567890));var realm="";var host=null;var nonce="";var qop="";var matches;while(challenge.match(attribMatch)){matches=challenge.match(attribMatch);challenge=challenge.replace(matches[0],"");matches[2]=matches[2].replace(/^"(.+)"$/,"$1");switch(matches[1]){case"realm":realm=matches[2];break;case"nonce":nonce=matches[2];break;case"qop":qop=matches[2];break;case"host":host=matches[2];break}}var digest_uri=connection.servtype+"/"+connection.domain;if(host!==null){digest_uri=digest_uri+"/"+host}var A1=MD5.hash(connection.authcid+":"+realm+":"+this._connection.pass)+":"+nonce+":"+cnonce;var A2="AUTHENTICATE:"+digest_uri;var responseText="";responseText+="charset=utf-8,";responseText+="username="+this._quote(connection.authcid)+",";responseText+="realm="+this._quote(realm)+",";responseText+="nonce="+this._quote(nonce)+",";responseText+="nc=00000001,";responseText+="cnonce="+this._quote(cnonce)+",";responseText+="digest-uri="+this._quote(digest_uri)+",";responseText+="response="+MD5.hexdigest(MD5.hexdigest(A1)+":"+nonce+":00000001:"+cnonce+":auth:"+MD5.hexdigest(A2))+",";responseText+="qop=auth";this.onChallenge=function(connection,challenge){return""}.bind(this);return responseText};Strophe.Connection.prototype.mechanisms[Strophe.SASLMD5.prototype.name]=Strophe.SASLMD5})(function(){window.Strophe=arguments[0];window.$build=arguments[1];window.$msg=arguments[2];window.$iq=arguments[3];window.$pres=arguments[4]});Strophe.Request=function(elem,func,rid,sends){this.id=++Strophe._requestId;this.xmlData=elem;this.data=Strophe.serialize(elem);this.origFunc=func;this.func=func;this.rid=rid;this.date=NaN;this.sends=sends||0;this.abort=false;this.dead=null;this.age=function(){if(!this.date){return 0}var now=new Date();return(now-this.date)/1000};this.timeDead=function(){if(!this.dead){return 0}var now=new Date();return(now-this.dead)/1000};this.xhr=this._newXHR()};Strophe.Request.prototype={getResponse:function(){var node=null;if(this.xhr.responseXML&&this.xhr.responseXML.documentElement){node=this.xhr.responseXML.documentElement;if(node.tagName=="parsererror"){Strophe.error("invalid response received");Strophe.error("responseText: "+this.xhr.responseText);Strophe.error("responseXML: "+Strophe.serialize(this.xhr.responseXML));throw"parsererror"}}else{if(this.xhr.responseText){Strophe.error("invalid response received");Strophe.error("responseText: "+this.xhr.responseText);Strophe.error("responseXML: "+Strophe.serialize(this.xhr.responseXML))}}return node},_newXHR:function(){var xhr=null;if(window.XMLHttpRequest){xhr=new XMLHttpRequest();if(xhr.overrideMimeType){xhr.overrideMimeType("text/xml")}}else{if(window.ActiveXObject){xhr=new ActiveXObject("Microsoft.XMLHTTP")}}xhr.onreadystatechange=this.func.bind(null,this);return xhr}};Strophe.Bosh=function(connection){this._conn=connection;this.rid=Math.floor(Math.random()*4294967295);this.sid=null;this.hold=1;this.wait=60;this.window=5;this._requests=[]};Strophe.Bosh.prototype={strip:null,_buildBody:function(){var bodyWrap=$build("body",{rid:this.rid++,xmlns:Strophe.NS.HTTPBIND});if(this.sid!==null){bodyWrap.attrs({sid:this.sid})}return bodyWrap},_reset:function(){this.rid=Math.floor(Math.random()*4294967295);this.sid=null},_connect:function(wait,hold,route){this.wait=wait||this.wait;this.hold=hold||this.hold;var body=this._buildBody().attrs({to:this._conn.domain,"xml:lang":"en",wait:this.wait,hold:this.hold,content:"text/xml; charset=utf-8",ver:"1.6","xmpp:version":"1.0","xmlns:xmpp":Strophe.NS.BOSH});if(route){body.attrs({route:route})}var _connect_cb=this._conn._connect_cb;this._requests.push(new Strophe.Request(body.tree(),this._onRequestStateChange.bind(this,_connect_cb.bind(this._conn)),body.tree().getAttribute("rid")));this._throttledRequestHandler()},_attach:function(jid,sid,rid,callback,wait,hold,wind){this._conn.jid=jid;this.sid=sid;this.rid=rid;this._conn.connect_callback=callback;this._conn.domain=Strophe.getDomainFromJid(this._conn.jid);this._conn.authenticated=true;this._conn.connected=true;this.wait=wait||this.wait;this.hold=hold||this.hold;this.window=wind||this.window;this._conn._changeConnectStatus(Strophe.Status.ATTACHED,null)},_connect_cb:function(bodyWrap){var typ=bodyWrap.getAttribute("type");var cond,conflict;if(typ!==null&&typ=="terminate"){Strophe.error("BOSH-Connection failed: "+cond);cond=bodyWrap.getAttribute("condition");conflict=bodyWrap.getElementsByTagName("conflict");if(cond!==null){if(cond=="remote-stream-error"&&conflict.length>0){cond="conflict"}this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,cond)}else{this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"unknown")}this._conn._doDisconnect();return Strophe.Status.CONNFAIL}if(!this.sid){this.sid=bodyWrap.getAttribute("sid")}var wind=bodyWrap.getAttribute("requests");if(wind){this.window=parseInt(wind,10)}var hold=bodyWrap.getAttribute("hold");if(hold){this.hold=parseInt(hold,10)}var wait=bodyWrap.getAttribute("wait");if(wait){this.wait=parseInt(wait,10)}},_disconnect:function(pres){this._sendTerminate(pres)},_doDisconnect:function(){this.sid=null;this.rid=Math.floor(Math.random()*4294967295)},_emptyQueue:function(){return this._requests.length===0},_hitError:function(reqStatus){this.errors++;Strophe.warn("request errored, status: "+reqStatus+", number of errors: "+this.errors);if(this.errors>4){this._onDisconnectTimeout()}},_no_auth_received:function(_callback){if(_callback){_callback=_callback.bind(this._conn)}else{_callback=this._conn._connect_cb.bind(this._conn)}var body=this._buildBody();this._requests.push(new Strophe.Request(body.tree(),this._onRequestStateChange.bind(this,_callback.bind(this._conn)),body.tree().getAttribute("rid")));this._throttledRequestHandler()},_onDisconnectTimeout:function(){var req;while(this._requests.length>0){req=this._requests.pop();req.abort=true;req.xhr.abort();req.xhr.onreadystatechange=function(){}}},_onIdle:function(){var data=this._conn._data;if(this._conn.authenticated&&this._requests.length===0&&data.length===0&&!this._conn.disconnecting){Strophe.info("no requests during idle cycle, sending blank request");data.push(null)}if(this._requests.length<2&&data.length>0&&!this._conn.paused){body=this._buildBody();for(i=0;i<data.length;i++){if(data[i]!==null){if(data[i]==="restart"){body.attrs({to:this._conn.domain,"xml:lang":"en","xmpp:restart":"true","xmlns:xmpp":Strophe.NS.BOSH})}else{body.cnode(data[i]).up()}}}delete this._conn._data;this._conn._data=[];this._requests.push(new Strophe.Request(body.tree(),this._onRequestStateChange.bind(this,this._conn._dataRecv.bind(this._conn)),body.tree().getAttribute("rid")));this._processRequest(this._requests.length-1)}if(this._requests.length>0){time_elapsed=this._requests[0].age();if(this._requests[0].dead!==null){if(this._requests[0].timeDead()>Math.floor(Strophe.SECONDARY_TIMEOUT*this.wait)){this._throttledRequestHandler()}}if(time_elapsed>Math.floor(Strophe.TIMEOUT*this.wait)){Strophe.warn("Request "+this._requests[0].id+" timed out, over "+Math.floor(Strophe.TIMEOUT*this.wait)+" seconds since last activity");this._throttledRequestHandler()}}},_onRequestStateChange:function(func,req){Strophe.debug("request id "+req.id+"."+req.sends+" state changed to "+req.xhr.readyState);if(req.abort){req.abort=false;return}var reqStatus;if(req.xhr.readyState==4){reqStatus=0;try{reqStatus=req.xhr.status}catch(e){}if(typeof(reqStatus)=="undefined"){reqStatus=0}if(this.disconnecting){if(reqStatus>=400){this._hitError(reqStatus);return}}var reqIs0=(this._requests[0]==req);var reqIs1=(this._requests[1]==req);if((reqStatus>0&&reqStatus<500)||req.sends>5){this._removeRequest(req);Strophe.debug("request id "+req.id+" should now be removed")}if(reqStatus==200){if(reqIs1||(reqIs0&&this._requests.length>0&&this._requests[0].age()>Math.floor(Strophe.SECONDARY_TIMEOUT*this.wait))){this._restartRequest(0)}Strophe.debug("request id "+req.id+"."+req.sends+" got 200");func(req);this.errors=0}else{Strophe.error("request id "+req.id+"."+req.sends+" error "+reqStatus+" happened");if(reqStatus===0||(reqStatus>=400&&reqStatus<600)||reqStatus>=12000){this._hitError(reqStatus);if(reqStatus>=400&&reqStatus<500){this._conn._changeConnectStatus(Strophe.Status.DISCONNECTING,null);this._conn._doDisconnect()}}}if(!((reqStatus>0&&reqStatus<500)||req.sends>5)){this._throttledRequestHandler()}}},_processRequest:function(i){var self=this;var req=this._requests[i];var reqStatus=-1;try{if(req.xhr.readyState==4){reqStatus=req.xhr.status}}catch(e){Strophe.error("caught an error in _requests["+i+"], reqStatus: "+reqStatus)}if(typeof(reqStatus)=="undefined"){reqStatus=-1}if(req.sends>this.maxRetries){this._onDisconnectTimeout();return}var time_elapsed=req.age();var primaryTimeout=(!isNaN(time_elapsed)&&time_elapsed>Math.floor(Strophe.TIMEOUT*this.wait));var secondaryTimeout=(req.dead!==null&&req.timeDead()>Math.floor(Strophe.SECONDARY_TIMEOUT*this.wait));var requestCompletedWithServerError=(req.xhr.readyState==4&&(reqStatus<1||reqStatus>=500));if(primaryTimeout||secondaryTimeout||requestCompletedWithServerError){if(secondaryTimeout){Strophe.error("Request "+this._requests[i].id+" timed out (secondary), restarting")}req.abort=true;req.xhr.abort();req.xhr.onreadystatechange=function(){};this._requests[i]=new Strophe.Request(req.xmlData,req.origFunc,req.rid,req.sends);req=this._requests[i]}if(req.xhr.readyState===0){Strophe.debug("request id "+req.id+"."+req.sends+" posting");try{req.xhr.open("POST",this._conn.service,true)}catch(e2){Strophe.error("XHR open failed.");if(!this._conn.connected){this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"bad-service")}this._conn.disconnect();return}var sendFunc=function(){req.date=new Date();if(self._conn._options.customHeaders){var headers=self._conn._options.customHeaders;for(var header in headers){if(headers.hasOwnProperty(header)){req.xhr.setRequestHeader(header,headers[header])}}}req.xhr.send(req.data)};if(req.sends>1){var backoff=Math.min(Math.floor(Strophe.TIMEOUT*this.wait),Math.pow(req.sends,3))*1000;setTimeout(sendFunc,backoff)}else{sendFunc()}req.sends++;if(this._conn.xmlOutput!==Strophe.Connection.prototype.xmlOutput){if(req.xmlData.nodeName===this.strip&&req.xmlData.childNodes.length){this._conn.xmlOutput(req.xmlData.childNodes[0])}else{this._conn.xmlOutput(req.xmlData)}}if(this._conn.rawOutput!==Strophe.Connection.prototype.rawOutput){this._conn.rawOutput(req.data)}}else{Strophe.debug("_processRequest: "+(i===0?"first":"second")+" request has readyState of "+req.xhr.readyState)}},_removeRequest:function(req){Strophe.debug("removing request");var i;for(i=this._requests.length-1;i>=0;i--){if(req==this._requests[i]){this._requests.splice(i,1)}}req.xhr.onreadystatechange=function(){};this._throttledRequestHandler()},_restartRequest:function(i){var req=this._requests[i];if(req.dead===null){req.dead=new Date()}this._processRequest(i)},_reqToData:function(req){try{return req.getResponse()}catch(e){if(e!="parsererror"){throw e}this._conn.disconnect("strophe-parsererror")}},_sendTerminate:function(pres){Strophe.info("_sendTerminate was called");var body=this._buildBody().attrs({type:"terminate"});if(pres){body.cnode(pres.tree())}var req=new Strophe.Request(body.tree(),this._onRequestStateChange.bind(this,this._conn._dataRecv.bind(this._conn)),body.tree().getAttribute("rid"));this._requests.push(req);this._throttledRequestHandler()},_send:function(){clearTimeout(this._conn._idleTimeout);this._throttledRequestHandler();this._conn._idleTimeout=setTimeout(this._conn._onIdle.bind(this._conn),100)},_sendRestart:function(){this._throttledRequestHandler();clearTimeout(this._conn._idleTimeout)},_throttledRequestHandler:function(){if(!this._requests){Strophe.debug("_throttledRequestHandler called with undefined requests")}else{Strophe.debug("_throttledRequestHandler called with "+this._requests.length+" requests")}if(!this._requests||this._requests.length===0){return}if(this._requests.length>0){this._processRequest(0)}if(this._requests.length>1&&Math.abs(this._requests[0].rid-this._requests[1].rid)<this.window){this._processRequest(1)}}};Strophe.Websocket=function(connection){this._conn=connection;this.strip="stream:stream";var service=connection.service;if(service.indexOf("ws:")!==0&&service.indexOf("wss:")!==0){var new_service="";if(connection._options.protocol==="ws"&&window.location.protocol!=="https:"){new_service+="ws"}else{new_service+="wss"}new_service+="://"+window.location.host;if(service.indexOf("/")!==0){new_service+=window.location.pathname+service}else{new_service+=service}connection.service=new_service}};Strophe.Websocket.prototype={_buildStream:function(){return $build("stream:stream",{to:this._conn.domain,xmlns:Strophe.NS.CLIENT,"xmlns:stream":Strophe.NS.STREAM,version:"1.0"})},_check_streamerror:function(bodyWrap,connectstatus){var errors=bodyWrap.getElementsByTagName("stream:error");if(errors.length===0){return false}var error=errors[0];var condition="";var text="";ns="urn:ietf:params:xml:ns:xmpp-streams";for(i=0;i<error.childNodes.length;i++){e=error.childNodes[i];if(e.getAttribute("xmlns")!==ns){break}if(e.nodeName==="text"){text=e.textContent}else{condition=e.nodeName}}errorString="WebSocket stream error: ";if(condition){errorString+=condition}else{errorString+="unknown"}if(text){errorString+=" - "+condition}Strophe.error(errorString);this._conn._changeConnectStatus(connectstatus,condition);this._conn._doDisconnect();return true},_reset:function(){return},_connect:function(){this._closeSocket();this.socket=new WebSocket(this._conn.service,"xmpp");this.socket.onopen=this._onOpen.bind(this);this.socket.onerror=this._onError.bind(this);this.socket.onclose=this._onClose.bind(this);this.socket.onmessage=this._connect_cb_wrapper.bind(this)},_connect_cb:function(bodyWrap){var error=this._check_streamerror(bodyWrap,Strophe.Status.CONNFAIL);if(error){return Strophe.Status.CONNFAIL}},_handleStreamStart:function(message){var error=false;var ns=message.getAttribute("xmlns");if(typeof ns!=="string"){error="Missing xmlns in stream:stream"}else{if(ns!==Strophe.NS.CLIENT){error="Wrong xmlns in stream:stream: "+ns}}var ns_stream=message.namespaceURI;if(typeof ns_stream!=="string"){error="Missing xmlns:stream in stream:stream"}else{if(ns_stream!==Strophe.NS.STREAM){error="Wrong xmlns:stream in stream:stream: "+ns_stream}}var ver=message.getAttribute("version");if(typeof ver!=="string"){error="Missing version in stream:stream"}else{if(ver!=="1.0"){error="Wrong version in stream:stream: "+ver}}if(error){this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,error);this._conn._doDisconnect();return false}return true},_connect_cb_wrapper:function(message){if(message.data.indexOf("<stream:stream ")===0||message.data.indexOf("<?xml")===0){var data=message.data.replace(/^(<\?.*?\?>\s*)*/,"");if(data===""){return}data=message.data.replace(/<stream:stream (.*[^\/])>/,"<stream:stream $1/>");var streamStart=new DOMParser().parseFromString(data,"text/xml").documentElement;this._conn.xmlInput(streamStart);this._conn.rawInput(message.data);if(this._handleStreamStart(streamStart)){this._connect_cb(streamStart);this.streamStart=message.data.replace(/^<stream:(.*)\/>$/,"<stream:$1>")}}else{if(message.data==="</stream:stream>"){this._conn.rawInput(message.data);this._conn.xmlInput(document.createElement("stream:stream"));this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,error);this._conn._doDisconnect();return}else{var string=this._streamWrap(message.data);var elem=new DOMParser().parseFromString(string,"text/xml").documentElement;this.socket.onmessage=this._onMessage.bind(this);this._conn._connect_cb(elem,null,message.data)}}},_disconnect:function(pres){if(this.socket.readyState!==WebSocket.CLOSED){if(pres){this._conn.send(pres)}var close="</stream:stream>";this._conn.xmlOutput(document.createElement("stream:stream"));this._conn.rawOutput(close);try{this.socket.send(close)}catch(e){Strophe.info("Couldn't send closing stream tag.")}}this._conn._doDisconnect()},_doDisconnect:function(){Strophe.info("WebSockets _doDisconnect was called");this._closeSocket()},_streamWrap:function(stanza){return this.streamStart+stanza+"</stream:stream>"},_closeSocket:function(){if(this.socket){try{this.socket.close()}catch(e){}}this.socket=null},_emptyQueue:function(){return true},_onClose:function(event){if(this._conn.connected&&!this._conn.disconnecting){Strophe.error("Websocket closed unexcectedly");this._conn._doDisconnect()}else{Strophe.info("Websocket closed")}},_no_auth_received:function(_callback){Strophe.error("Server did not send any auth methods");this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"Server did not send any auth methods");if(_callback){_callback=_callback.bind(this._conn);_callback()}this._conn._doDisconnect()},_onDisconnectTimeout:function(){},_onError:function(error){Strophe.error("Websocket error "+error);this._conn._changeConnectStatus(Strophe.Status.CONNFAIL,"The WebSocket connection could not be established was disconnected.");this._disconnect()},_onIdle:function(){var data=this._conn._data;if(data.length>0&&!this._conn.paused){for(i=0;i<data.length;i++){if(data[i]!==null){var stanza,rawStanza;if(data[i]==="restart"){stanza=this._buildStream();rawStanza=this._removeClosingTag(stanza);stanza=stanza.tree()}else{stanza=data[i];rawStanza=Strophe.serialize(stanza)}this._conn.xmlOutput(stanza);this._conn.rawOutput(rawStanza);this.socket.send(rawStanza)}}this._conn._data=[]}},_onMessage:function(message){var elem;if(message.data==="</stream:stream>"){var close="</stream:stream>";this._conn.rawInput(close);this._conn.xmlInput(document.createElement("stream:stream"));if(!this._conn.disconnecting){this._conn._doDisconnect()}return}else{if(message.data.search("<stream:stream ")===0){data=message.data.replace(/<stream:stream (.*[^\/])>/,"<stream:stream $1/>");elem=new DOMParser().parseFromString(data,"text/xml").documentElement;if(!this._handleStreamStart(elem)){return}}else{data=this._streamWrap(message.data);elem=new DOMParser().parseFromString(data,"text/xml").documentElement}}if(this._check_streamerror(elem,Strophe.Status.ERROR)){return}if(this._conn.disconnecting&&elem.firstChild.nodeName==="presence"&&elem.firstChild.getAttribute("type")==="unavailable"){this._conn.xmlInput(elem);this._conn.rawInput(Strophe.serialize(elem));return}this._conn._dataRecv(elem,message.data)},_onOpen:function(){Strophe.info("Websocket open");var start=this._buildStream();this._conn.xmlOutput(start.tree());var startString=this._removeClosingTag(start);this._conn.rawOutput(startString);this.socket.send(startString)},_removeClosingTag:function(elem){var string=Strophe.serialize(elem);string=string.replace(/<(stream:stream .*[^\/])\/>$/,"<$1>");return string},_reqToData:function(stanza){return stanza},_send:function(){this._conn.flush()},_sendRestart:function(){clearTimeout(this._conn._idleTimeout);this._conn._onIdle.bind(this._conn)()}};Strophe.addConnectionPlugin("disco",{_connection:null,_identities:[],_features:[],_items:[],init:function(a){this._connection=a;this._identities=[];this._features=[];this._items=[];a.addHandler(this._onDiscoInfo.bind(this),Strophe.NS.DISCO_INFO,"iq","get",null,null);a.addHandler(this._onDiscoItems.bind(this),Strophe.NS.DISCO_ITEMS,"iq","get",null,null)},addIdentity:function(d,c,a,e){for(var b=0;b<this._identities.length;b++){if(this._identities[b].category==d&&this._identities[b].type==c&&this._identities[b].name==a&&this._identities[b].lang==e){return false}}this._identities.push({category:d,type:c,name:a,lang:e});return true},addFeature:function(b){for(var a=0;a<this._features.length;a++){if(this._features[a]==b){return false}}this._features.push(b);return true},removeFeature:function(b){for(var a=0;a<this._features.length;a++){if(this._features[a]===b){this._features.splice(a,1);return true}}return false},addItem:function(b,a,c,d){if(c&&!d){return false}this._items.push({jid:b,name:a,node:c,call_back:d});return true},info:function(c,d,g,b,e){var a={xmlns:Strophe.NS.DISCO_INFO};if(d){a.node=d}var f=$iq({from:this._connection.jid,to:c,type:"get"}).c("query",a);this._connection.sendIQ(f,g,b,e)},items:function(d,e,g,c,f){var b={xmlns:Strophe.NS.DISCO_ITEMS};if(e){b.node=e}var a=$iq({from:this._connection.jid,to:d,type:"get"}).c("query",b);this._connection.sendIQ(a,g,c,f)},_buildIQResult:function(c,b){var e=c.getAttribute("id");var d=c.getAttribute("from");var a=$iq({type:"result",id:e});if(d!==null){a.attrs({to:d})}return a.c("query",b)},_onDiscoInfo:function(e){var d=e.getElementsByTagName("query")[0].getAttribute("node");var a={xmlns:Strophe.NS.DISCO_INFO};if(d){a.node=d}var c=this._buildIQResult(e,a);for(var b=0;b<this._identities.length;b++){var a={category:this._identities[b].category,type:this._identities[b].type};if(this._identities[b].name){a.name=this._identities[b].name}if(this._identities[b].lang){a["xml:lang"]=this._identities[b].lang}c.c("identity",a).up()}for(var b=0;b<this._features.length;b++){c.c("feature",{"var":this._features[b]}).up()}this._connection.send(c.tree());return true},_onDiscoItems:function(g){var f={xmlns:Strophe.NS.DISCO_ITEMS};var e=g.getElementsByTagName("query")[0].getAttribute("node");if(e){f.node=e;var a=[];for(var c=0;c<this._items.length;c++){if(this._items[c].node==e){a=this._items[c].call_back(g);break}}}else{var a=this._items}var d=this._buildIQResult(g,f);for(var c=0;c<a.length;c++){var b={jid:a[c].jid};if(a[c].name){b.name=a[c].name}if(a[c].node){b.node=a[c].node}d.c("item",b).up()}this._connection.send(d.tree());return true}});/* jshint -W117 */
function TraceablePeerConnection(ice_config, constraints) {
    var self = this;
    var RTCPeerconnection = navigator.mozGetUserMedia ? mozRTCPeerConnection : webkitRTCPeerConnection;
    this.peerconnection = new RTCPeerconnection(ice_config, constraints);
    this.updateLog = [];
    this.stats = {};

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
    // FIXME: is it a good idea to automatically start it here?
    this.statsinterval = null;

    this.maxstats = 600; // limit to 600 values, i.e. 10 minutes
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
                            values: []
                        };
                    }
                    self.stats[id].values.push(results[i].stat(name));
                    if (self.stats[id].values.length > self.maxstats) {
                        self.stats[id].values.shift();
                    }
                    self.stats[id].endTime = now;
                });
            }
        });

    }, 1000);
};

dumpSDP = function(description) {
    return 'type: ' + description.type + '\r\n' + description.sdp;
}

TraceablePeerConnection.prototype.__defineGetter__('signalingState', function() { return this.peerconnection.signalingState; });
TraceablePeerConnection.prototype.__defineGetter__('iceConnectionState', function() { return this.peerconnection.iceConnectionState; });
TraceablePeerConnection.prototype.__defineGetter__('localDescription', function() { return this.peerconnection.localDescription; });
TraceablePeerConnection.prototype.__defineGetter__('remoteDescription', function() { return this.peerconnection.remoteDescription; });

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

TraceablePeerConnection.prototype.getStats = function(callback) {
    this.peerconnection.getStats(callback);
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
        //var self = this;
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
                this.connection.jingle.ice_config.iceServers = iceservers;
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
            // new plan
            elem.c('group', {xmlns: 'urn:xmpp:jingle:apps:grouping:0', type: semantics, semantics:semantics});
            for (j = 0; j < tmp.length; j++) {
                elem.c('content', {name: tmp[j]}).up();
            }
            elem.up();

            // temporary plan, to be removed
            elem.c('group', {xmlns: 'urn:ietf:rfc:5888', type: semantics});
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
                    // start 10ms callout
                    window.setTimeout(function () {
                        if (self.drip_container.length === 0) return;
                        var allcands = self.drip_container;
                        self.drip_container = [];
                        var cand = $iq({to: self.peerjid, type: 'set'})
                            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                               action: 'transport-info',
                               initiator: self.initiator,
                               sid: self.sid});
                        for (var mid = 0; mid < self.localSDP.media.length; mid++) {
                            var cands = allcands.filter(function (el) { return el.sdpMLineIndex == mid; });
                            if (cands.length > 0) {
                                var ice = SDPUtil.iceparams(self.localSDP.media[mid], self.localSDP.session);
                                ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
                                cand.c('content', {creator: self.initiator == self.me ? 'initiator' : 'responder',
                                       name: cands[0].sdpMid
                                }).c('transport', ice);
                                for (var i = 0; i < cands.length; i++) {
                                    cand.c('candidate', SDPUtil.candidateToJingle(cands[i].candidate)).up();
                                }
                                // add fingerprint
                                if (SDPUtil.find_line(self.localSDP.media[mid], 'a=fingerprint:', self.localSDP.session)) {
                                    var tmp = SDPUtil.parse_fingerprint(SDPUtil.find_line(self.localSDP.media[mid], 'a=fingerprint:', self.localSDP.session));
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
                        //console.log('was this the last candidate', self.lasticecandidate);
                        self.connection.sendIQ(cand,
                            function () {
                                var ack = {};
                                ack.source = 'transportinfo';
                                $(document).trigger('ack.jingle', [self.sid, ack]);
                            },
                            function (stanza) {
                                var error = ($(stanza).find('error').length) ? {
                                    code: $(stanza).find('error').attr('code'),
                                    reason: $(stanza).find('error :first')[0].tagName,
                                }:{};
                                error.source = 'transportinfo';
                                $(document).trigger('error.jingle', [self.sid, error]);
                            },
                        10000);
                    }, 10);
                }
                this.drip_container.push(event.candidate);
                return;
            }
            // map to transport-info
            var cand = $iq({to: this.peerjid, type: 'set'})
                .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                        action: 'transport-info',
                        initiator: this.initiator,
                        sid: this.sid})
                .c('content', {creator: this.initiator == this.me ? 'initiator' : 'responder',
                        name: candidate.sdpMid
                        })
                .c('transport', ice)
                .c('candidate', jcand);
            cand.up();
            // add fingerprint
            if (SDPUtil.find_line(this.localSDP.media[candidate.sdpMLineIndex], 'a=fingerprint:', this.localSDP.session)) {
                var tmp = SDPUtil.parse_fingerprint(SDPUtil.find_line(this.localSDP.media[candidate.sdpMLineIndex], 'a=fingerprint:', this.localSDP.session));
                tmp.required = true;
                cand.c('fingerprint').t(tmp.fingerprint);
                delete tmp.fingerprint;
                cand.attrs(tmp);
                cand.up();
            }
            this.connection.sendIQ(cand,
                function () {
                    var ack = {};
                    ack.source = 'transportinfo';
                    $(document).trigger('ack.jingle', [self.sid, ack]);
                },
                function (stanza) {
                    console.error('transport info error');
                    var error = ($(stanza).find('error').length) ? {
                        code: $(stanza).find('error').attr('code'),
                        reason: $(stanza).find('error :first')[0].tagName,
                    }:{};
                    error.source = 'transportinfo';
                    $(document).trigger('error.jingle', [self.sid, error]);
                },
            10000);
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
    if (!(this.addssrc.length || this.removessrc.length)) return;
    if (this.peerconnection.signalingState == 'closed') return;
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


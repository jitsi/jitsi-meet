/**
 * Processes links and smileys in "body"
 */
function processReplacements(body)
{
    //make links clickable
    body = linkify(body);
    
    //add smileys
    body = smilify(body);
    
    return body;
}

/**
 * Finds and replaces all links in the links in "body" 
 * with their <a href=""></a>
 */
function linkify(inputText)
{
    var replacedText, replacePattern1, replacePattern2, replacePattern3;
    
    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
    
    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
    
    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
    
    return replacedText;
}

/**
 * Replaces common smiley strings with images
 */
function smilify(body)
{
    if(!body)
        return body;
    
    body = body.replace(/(:\(|:\(\(|:-\(\(|:-\(|\(sad\))/gi, "<img src="+smiley1+ ">");
    body = body.replace(/(\(angry\))/gi, "<img src="+smiley2+ ">");
    body = body.replace(/(\(n\))/gi, "<img src="+smiley3+ ">");
    body = body.replace(/(:-\)\)|:\)\)|;-\)\)|;\)\)|\(lol\)|:-D|:D|;-D|;D)/gi, "<img src="+smiley4+ ">");
    body = body.replace(/(;-\(\(|;\(\(|;-\(|;\(|:'\(|:'-\(|:~-\(|:~\(|\(upset\))/gi, "<img src="+smiley5+ ">");
    body = body.replace(/(<3|&lt;3|\(L\)|\(l\)|\(H\)|\(h\))/gi, "<img src="+smiley6+ ">");
    body = body.replace(/(\(angel\))/gi, "<img src="+smiley7+ ">");
    body = body.replace(/(\(bomb\))/gi, "<img src="+smiley8+ ">");
    body = body.replace(/(\(chuckle\))/gi, "<img src="+smiley9+ ">");
    body = body.replace(/(\(y\)|\(Y\)|\(ok\))/gi, "<img src="+smiley10+ ">");
    body = body.replace(/(;-\)|;\)|:-\)|:\))/gi, "<img src="+smiley11+ ">");
    body = body.replace(/(\(blush\))/gi, "<img src="+smiley12+ ">");
    body = body.replace(/(:-\*|:\*|\(kiss\))/gi, "<img src="+smiley13+ ">");
    body = body.replace(/(\(search\))/gi, "<img src="+smiley14+ ">");
    body = body.replace(/(\(wave\))/gi, "<img src="+smiley15+ ">");
    body = body.replace(/(\(clap\))/gi, "<img src="+smiley16+ ">");
    body = body.replace(/(\(sick\))/gi, "<img src="+smiley17+ ">");
    body = body.replace(/(:-P|:P|:-p|:p)/gi, "<img src="+smiley18+ ">");
    body = body.replace(/(:-\0|\(shocked\))/gi, "<img src="+smiley19+ ">");
    body = body.replace(/(\(oops\))/gi, "<img src="+smiley20+ ">");
                                  
    return body
};
                                

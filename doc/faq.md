**1. How to tell if my server instance is behind NAT?**

A. In general, if the tool ifconfig (or ipconfig) shows the assigned IP address to be some local address (10.x.x.x or 192.x.x.x) but you know that its public IP address is different from that, the server is most probably behind NAT

**2. Clients could communicate well in room created at meet.jit.si . The same clients still could connect to my self-hosted instance but can neither hear nor see one another. What's wrong?**

A. Most probably, the server is behind NAT. See this [resolved question](https://community.jitsi.org/t/cannot-see-video-or-hear-audio-on-self-hosted-instance/). You need to follow the steps detailed [here](https://github.com/jitsi/jitsi-meet/blob/master/doc/quick-install.md#Advanced-configuration)

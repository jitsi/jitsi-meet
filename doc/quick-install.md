# Jitsi Meet quick install

This documents decribes the needed steps for quick Jitsi Meet installation on a Debian based GNU/Linux system.

# Add the repository

```sh
add-apt-repository 'deb http://download.jitsi.org/nightly/deb unstable/'
```

add-apt-repository is in the default Ubuntu install and is available for both Ubuntu and Debian, but if it's not present, either install it with

```sh
apt-get -y install software-properties-common
```

or add the repository by hand with

```sh
echo 'deb http://download.jitsi.org/nightly/deb trusty unstable/' >> /etc/apt/sources.list
```

# Update the package lists

```sh
apt-get update
```

# Install Jitsi Meet

```sh
apt-get -y install jitsi-meet
```

During the installation you'll be asked to enter the hostname of the Jitsi Meet instance. If you have a FQDN hostname for the instance already set ip in DNS, enter it there. If you don't have a resolvable hostname, you can enter the IP address of the machine (if it is static or doesn't change).

This hostname (ot IP address) will be used for virtualhost configuration inside the Jitsi Meet and also you and your correspondents will be using it to access the web conferences.

# Open a conference

Launch a web broswer (Chrome, Chromium or latest Opera) and enter in the URL bar the hostname (or IP address) you used in the previous step.

Confirm that you trust the self-signed certificate of the newly installed Jitsi Meet.

Enjoy!

# Add sip-gateway to Jitsi Meet


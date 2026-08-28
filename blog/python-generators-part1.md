---
slug: python-generators-part1
title: "Learning generators part 1: Basics"
authors: csressel
---

How generators can be used in four ways (from simple to complex):

1. **Lazy-like expressions, including unbounded sequences**
2. **Alternating control flow with the caller**
3. A "pure-looking" function, with hidden internal state
4. Internally managing a state-machine, that handles caller-passed input

The first two use cases are covered in this article, and serve as a primer to the topic.

The second two use cases are covered in the [second part here](/blog/python-generators-part2), and might provide a new applied usage for those already familiar with generators and coroutines.

---

## Lazy Expressions and Unbounded Sequences

Users usually first experience lazy-like behavior in Python when iterating through sequences, like so:

<!-- truncate -->

```python
fizzbuzz_squares = []

# Doesn't ever store 5mil elements at once:
for i in range(5_000_000):
    if i ** 2 % 15 == 0:
        fizzbuzz_squares.append(i ** 2)

# Or more succinctly, with generator comprehension syntax:
fizzbuzz_squares = list((i**2 for i in range(5_000_000) if i ** 2 % 15 == 0))
```

The `range` function is a builtin that doesn't return a generator. Instead, `range()` uses its own class, which implements the Iterable and the Sequence protocols with a lazy design thereof.
This is important so that an interpreter like CPython can execute instructions more quickly using the corresponding C builtin implementation, instead of interpreting comparitively slow Python bytecode.

However, this behavior is so useful that it is necessary to generalize it for other use csae.
Take for example unbounded sequences, where we by necessity need laziness.
The [`count` function from the `itertools` module](https://docs.python.org/3/library/itertools.html#itertools.count) is implemented like so:

```python
def count(start=0, step=1):
    # count(10) --> 10 11 12 13 14 ...
    # count(2.5, 0.5) --> 2.5 3.0 3.5 ...
    n = start
    while True:
        yield n
        n += step
```

Taking this back to our Fizz Buzz snippet, we might use unbounded sequences to calculate our value without actually knowing the stop condition up front.
For example, to get all of the Fizz Buzz squares less than one million:

```python
from itertools import count, takewhile

max_value = 1_000_000
fizzbuzz_squares = []

for candidate in count():
    squared = candidate ** 2
    if max_value <= squared:
        break
    if squared % 15 == 0:
        fizzbuzz_squares.append(squared)

# Or more succinctly, with generator comprehension syntax:
fizzbuzz_squares = list(takewhile(lambda i: i < max_value, (i ** 2 for i in count() if i ** 2 % 15 == 0)))
```

Even more useful, is that if we don't know how many we need, we can remove that final `list` construction and the entire computation remains lazily delayed.
This is particularly key when the incremental computation that results from your generator involves more expensive work, like network traffic or blocking access to a database.
By pausing and resuming stack frames with the generator, each value is only computed right as it is needed, and the work can be aborted partway through with no extra cost:

```python
from itertools import count
from time import sleep
import psycopg2

def expensive_queries(cursor):
    for candidate in count():
        cursor.execute(f"<expensive analysis query using {candidate}>")
        sleep(10)
        yield cursor.fetchone()

conn = psycopg2.connect("dbname=test user=postgres")
cursor = conn.cursor()
for result in expensive_queries(cursor):
    if result:  # Check some behavior about result
        print(f"Found result: {result[0]=} {result[1]=} {result[2]=} ...")
        break

cursor.close()
conn.close()
```

---
## Alternating Control Flow With the Caller

The next interesting use case for generators highlights the alternation with the caller of the generator.
This is a mechanism by which a reusable piece of code can "take turns" with the caller.
Context managers (that whole `with ... as:` syntax, for setup/teardown behavior) is implemented exactly this way.
This makes sense, as context managers are the most plain alternation of control flow possible: in my reusable code, I'll do some setup, then you do whatever you need to do, then I'll do some teardown.

```python
from contextlib import contextmanager
from typing import Generator

@contextmanager
def simple_context() -> Generator[None, None, None]:
  print("Setup in the generator")
  try:
    yield  # "Here is my calling code"
  finally:
    print("Teardown in the generator")

with simple_context():
  print("Here is my calling code")
```

A further generalization of this control alternation includes taking multiple turns with the caller.
This way the caller can complete any individualized logic that would otherwise need extra modalities baked into the reusable code.
This use case is extensively taught by James Powell in some of his tech talks on generators, so I'll just extend [one of his examples](https://www.youtube.com/watch?v=JasPrZqImxo) (based on 13:50):

```python
from typing import Generator
from logging import getLogger

logger = getLogger(__name__)

# All output implementations send the same result:
#
# New York        150,000
# London      (    50,000)
# Tokyo           120,000
# Berlin                -
# Shanghai        210,000

def send_email(lines: str) -> None: pass  # Implementation not relevant

# ----
# This is awful to modify,
# awful to test each modality for regression,
# and the testing gets even worse when
# you think about combinations thereof
def output_modal(
    markets,
    filename=None,
    to_log=False,
    to_email=False,
    accounting=False,
) -> None:
    align = max(map(len, markets))

    if to_email:
        lines = []

    for region, profit in markets.items():
        if accounting:
            if profit < 0:
                profit = "({:>10,})".format(-profit)
            elif profit > 0:
                profit = " {:>10,}".format(profit)
            else:
                profit = " {:>10}".format("-")

        line = "{region:<{align}}    {profit}".format(
            region=region, profit=profit, align=align
        )

        if filename:
            with open(filename) as f:
                f.write(line)
        if to_email:
            lines.append(line)
        if to_log:
            logger.info(line)
        print(line)

    if to_email:
        send_email("\n".join(lines))

# ----
# Functional programming inversion of modal control on just the formatting
template = "{region:<{align}}    {profit}".format
def accounting(p) -> str:
    # Here's where "Pythonic" approaches are unreadable BS imo:
    # return {1: " {:10,}", -1: "({:>10,})", 0: " {:>10}".format("-")}[(p > 0) - (p < 0)].format(abs(p))

    match (p > 0, p < 0):
        # Structural pattern matching is good as of 3.10, use it!
        case (True, False):
            return " {:10,}".format(p)
        case (False, True):
            return "({:>10,})".format(-p)
        case _:
            return " {:>10}".format("-")
def output_functional(
    markets,
    write=print,
    template=template,
    accounting=accounting,
) -> None:
    align = max(map(len, markets))
    for region, profit in markets.items():
        write(template(region=region, profit=accounting(profit), align=align))

# ----
# Even better yet, invert more modal control on the output using generators
def output_generators(
    markets,
    template=template,
    accounting=accounting,
) -> Generator[str, None, None]:
    align = max(map(len, markets))
    for region, profit in markets.items():
        line = template(region=region, profit=accounting(profit), align=align)
        yield line


if __name__ == "__main__":
    markets_data = {
        "New York": 150000,
        "London": -50000,
        "Tokyo": 120000,
        "Berlin": 0,
        "Shanghai": 210000,
    }

    # Output modal is a monstrosity internally to read and maintain
    output_modal(
        markets_data,
        to_log=True,
        to_email=True,
        accounting=True,
    )

    # Even though output with functional style is easier to maintain,
    # it's still harder to call:
    email_lines = []
    write_log = logger.info
    write_email = email_lines.append
    output_functional(markets_data, write=print)
    output_functional(markets_data, write=write_log)
    output_functional(markets_data, write=write_email)
    send_email("\n".join(email_lines))

    # Whereas output with generators is much cleaner:
    email_lines = []
    for line in output_generators(markets_data):
        print(line)
        logger.info(line)
    send_email("\n".join(email_lines))
```

While my preferences usually lean toward a functional approach, the generators have additional advantages.
The generator approach is shorter, and I would argue significantly clearer, because all necessary context about the output modalities is correctly placed with the calling code.
The maintainability is also improved, as formatting changes only touch the formatting functions, data structure changes only touch the function internals, and output interface changes are in one place with the caller.

Additionally, the generators can also have a different or better runtime profile over the functional one, during scenarios where the number of alternations is very high (since each "turn taking" step alternates between pre-existing function frames that are paused and resumed instead of creating and destroying them repeatedly).
Just be warned, this isn't unilaterally true, as there is additional overhead for constructing the `Generator` object, which a function call does not incur.

Those topics, Lazy-like expressions and sequences and control flow alternation, was about where my understanding of generators stopped until recently. The [second part of this article](/blog/python-generators-part2) may introduce one or two new code abstractions for your toolbox, as it did for me!

---
slug: drawing-monospace-text
title: "Is drawing a monospace terminal display straightforward?"
authors: csressel
---

# Is drawing a monospace terminal display straightforward?

Why does Anthropic &mdash;
the frontier AI lab valued at billions of dollars,
owner of the most sophisticated AI coding tools,
and the undisputed king of agents for 2025 &mdash;
struggle so much with rendering monospace text?

From paper teletypewriters to modern digital emulators, terminal interfaces have always printed out a simple monospace text grid.
This avoids some of the toughest problems in text rendering: the styling is heavily constrained, you often have a single font, one or two colors per grid cell, and the layout and shaping is relatively trivial.[^1]
In the words of Casey Muratori:

> Drawing a monospace terminal display is straightforward....<br /><br />
> \[8 sentence pseudocode for the full rendering pipeline...\]<br /><br />
> ...That's it, right? I mean that is the entire renderer. 

Given these expectations for terminals, there was consternation from devs when details surfaced on X about the Claude Code rendering architecture:

<!-- truncate -->

:::twitter
Most people's mental model of Claude Code is that "it's just a TUI" but it should really be closer to "a small game engine".

For each frame our pipeline constructs a scene graph with React then<br/>
-> layouts elements<br/>
-> rasterizes them to a 2d screen<br/>
-> diffs that against the previous screen<br/>
-> finally uses the diff to generate ANSI sequences to draw<br/>

We have a ~16ms frame budget so we have roughly ~5ms to go from the React scene graph to ANSI written.

[- Thariq Shihipar](https://xcancel.com/trq212/status/2014051501786931427)
:::

Responses ranged widely in tone, but shared a similar message.

:::twitter
...It's one of the worst technical things I've ever heard, posted with a straight face...

[- Jonathan Blow](https://xcancel.com/Jonathan_Blow/status/2014920254926029179)
:::

:::twitter
Sometimes, developers get hyper-focused on tackling the immediate technical challenges in front of them that it prevents them from reflecting on past decisions.
It's like you take a fork in a road, and find you need to climb a mountain.
The faster route to your destination may be to backtrack, and take a more direct route without a mountain in the way...

[- Will McGugan](https://xcancel.com/willmcgugan/status/2014341532338606480)
:::

:::twitter
We apparently live in the clown universe, where a simple TUI is driven by React and takes 11ms to lay out a few boxes and monospaced text...

[- Ben Visness](https://xcancel.com/its_bvisness/status/2014381220214309042)
:::

During the storm of criticism, there was at least a little bit of levity:

:::twitter
Layout 0.9ms<br/>
Rasterization 2.1ms<br/>
Diffing 1.2ms<br/>
Building the React scene graph 11.0ms<br/>
Generating ANSI sequences 0.8ms<br/><br/>

someone who is good at the computer please help me budget this. my small game engine is dying

[- barrowfaustus](https://xcancel.com/barrowfaustus/status/2014270514550730867)
:::

But many of the responses were even ruder (because some people really get off on being smug and critical on the internet).
I think there's slightly more to it than that, and the Claude Code team obviously had reasons to go in the direction they did.
Instead of coming in with another dunk (React? hahaha amirite), let's see what there is to learn if we think about the tradeoffs and limitations that they're working with.

Before generalizing to some broader comparison points like React vs Ratatui, garbage collected vs not, interpreted vs compiled, I'll begin with some concrete estimates for this type of workload, and why the rebuild around diff-based rendering makes sense.

## Speed of light (text) in the terminal

Any terminal interface is fundamentally limited by two things.
To understand this, it's important to consider the basic pseudoterminal (pty) architecture.
A program called a "virtual terminal emulator" like iTerm2, Ghostty, VSCode integrated terminal, etc, is used to run or view any terminal process like Claude Code, NetHack, `cat /dev/urandom`, etc.
To connect these two, the OS opens up a bidirectional communication channel with a "master" end (the terminal app, what I'll call the emulator) and the "slave" end (the foreground process group, what I'll call the process).[^2]
Data sent from the emulator to the process appears as stdin. Conversely, the process writes to stdout and stderr, which the emulator receives and parses to update the display.
All of these are byte streams containing a mix of Unicode, ANSI escape sequences, and newer and rarer terminal protocol escape sequences. 

So imagine you've built a program that will render a terminal interface.
Based on the pty architecture, the two limits on the rendering speed are:

1. How fast can your program process and respond to new data?
   Including `stdin` data like key presses and window resizes, or other data like reading files, network responses, and subprocess results.
2. How fast can everything that is *not* your program, mainly the emulator on the other end, receive and render your output bytestream?
   Technically the pty communication itself also falls into the "not your program" category and also includes some work (like the line discipline or context switches), but this is nowhere close to the emulator's own bottleneck.

:::info
Unrelated, but did you know there's an actual hard limit on how many terminal interfaces you can have open?! From the Linux pty manpage:


```
$ man pty
...
The Linux kernel imposes a limit on the number of available UNIX
98 pseudoterminals. Up to and including Linux 2.6.3, this limit
is configured at kernel compilation time (CONFIG_UNIX98_PTYS),
and the permitted number of pseudoterminals can be up to 2048,
with a default setting of 256. Since Linux 2.6.4, the limit is
dynamically adjustable via /proc/sys/kernel/pty/max, and a
corresponding file, /proc/sys/kernel/pty/nr, indicates  how  many
pseudoterminals  are  currently  in  use.
...
```
:::

Time for some napkin math.
Imagine we want to rerender as many lines of history as possible: what limits should we expect the bottleneck in the emulator to impose on us?
Looking at one of my chats, a 150,000 token chat history contains about 53KB of printed text.
The full count of tokens would be more like 1MB of text, but the majority of that context contains the thinking tokens (not shown) and the tool calls (truncated), so the output is much smaller.
However, not shown in the raw 53KB of text are the escape codes for colors, bold or dim, and ANSI codes for movement and clearing and printing; altogether this could conceivably double or triple the size in raw bytes.[^3]
So we're looking at something in the low hundreds of KB across the pty connection, for the size of each frame of full history render.
Assuming a 60 FPS experience, we're looking at ~10MB per second (for example, when an active and updating history cell is just off screen, the frequent cause of Claude Code flicker last year).

So how close is this to the theoretical max throughput of the emulator?
Using the [cmuratori/termbench](https://github.com/cmuratori/termbench) repo, I can compare a few terminals' max throughput on colored text (see Appendix: Emulator Throughput).
To summarize the results from below, modern emulators on modern hardware show result between 30-100MB/s, and legacy emulators are at least an order of magnitude less than that.
The GPU-accelerated terminal emulators on my laptop are right around the median of ~50-60MB/s.
Non-GPU-accelerated terminals (that instead allow synchronous frame drops) show similar throughput.
The similarity is unsurprising; the bottleneck doesn't come from the rasterization but from the singly threaded CPU-bound logic to track the state machine of ANSI codes.
The variance in my results, at least for the Linux ecosystem, correlates far more with hardware than with the emulator.
The built-in terminal versus GPU accelerated terminal on my Mac Mini shows another performance gap: 30MB/s versus 65MB/s.
I don't have the appetite to benchmark Windows today, but trust me when I say it's generally a cut below the Unix systems.
Finally, on a raw Linux kernel TTY (e.g. ttyN) without graphical emulation, using minimal device drivers, no GPU acceleration, and no logic for synchronous frame drops, we see the legacy graphics bottleneck: just over 100KB/s.
Not per frame, per *second*.

So the napkin math puts us in 10-50MB/s territory for most setups, and the dreaded flicker scenario (an updating cell offscreen, and a naive history reprint) requires up to 10MB/s.
This doesn't *fully* preclude the possibility of a full history rerender for newer setups, but it's not looking good!
These benchmarks show a theoretical maximum that is within the same order of magnitude as the required throughput.
This evidence does guarantee the full history rerender will be painful on some legacy terminal emulators or very old hardware, and it will likely introduce frame drops and brief flickers on all but the most optimized setups.
The important detail here is that these limitations are *completely absent any implementation choices of the code itself*.
This is the maximum speed of the pty architecture, for the requirements the Claude Code team is operating under.

This was the most ignorant part of the critique last week, that lampooned the new architecture, or the software choices.
I question the requirements the Claude Code team has set, but to implement those requirements they absolutely need a new architecture like they described.
Game engine programming is often impressive because after saturating performance bottlenecks in the hardware or OS or another abstraction outside your control, you need to design a smarter approach for your workload.
In that light, Thariq's comparison is fair.

## The new architecture

### A retained mode renderer

The details of their new architecture solve this throughput issue. Rather than forcing entire documents down the pty bottleneck, the new architecture implements the terminal equivalent of a retained mode interface.
The emulator retains the screen state between frames, and the program is expected to push down only the minimal ANSI codes to move the cursor (`CUP`) and update specific cells.
Anyone familiar with the Ratatui library knows this pattern. The application still describes the UI every frame, but the new renderer only transmits the changes.

As compared to the React virtual DOM:

* **On the Web:** DOM updates are slow, so we use VDOM to minimize *browser repaints*.
* **In the Terminal:** The byte stream is fast, but the *parsing* is the bottleneck.

By treating the terminal as a grid of cells rather than a tree of objects, the terminal avoids any "parser jitter."
However, implementing this inside a React-like framework means they are using a nested object tree.
Not only is this algorithmically more distant from the text grid, it is still creating thousands (tens of thousands?) of short-lived objects per frame to represent that grid of characters.
The new design has fixed the I/O bottleneck, but they likely increased the GC pressure, moving the accidental complexity elsewhere.

This leaves us with the remaining, more permanent issue that Claude Code is now dealing with: fighting the framework.

### Let history be history

Terminal emulators are optimized for two distinct scenarios. 

1. **The Scrollback**: the program turns information over to the emulator to own.
   Immutable, fast, and forgotten by the program.
   The pty is explicitly optimized for direct copyover of plain Unicode data.
2. **The Viewport**: information fully owned by the app.
   Interactive, temporary, easily customized UI, dynamic rewraps.
   The altscreen mode offers a separate buffer, fully controlled by the foreground process (like neovim or Emacs or top).
   Limited height viewports can also be implemented below the history (like `fzf --inline`).

Claude Code has decided to violate this contract. It decides to treat the *entire* scrollback as a reactive viewport.
Ostensibly, there are some benefits over altscreen: native search (cmd-F or similar), native text selection, native clipboard interactions, or a longer list of multiplexer features.
But the cost is fragility.

When the context gets too long, Claude "compacts" the history.
In doing so, it often clears the *entire* terminal scrollback, including history from before the Claude Code session!
Similarly, "fake fullscreen" features (like ctrl+o extended output) rewrite the history instead of using altscreen, so any failure scenario risks a broken scrollback that you can't reference or copy from.
The most convenient feature is history rewrapping on window resize, and that is gone the moment you quit Claude Code, leaving you with the static history artifact that you were briefly told not to settle for!

### Non-pessimization of the requirements

Pessimization involves crippling the performance of your program, either by assuming requirements that don't exist, or ignoring constraints that do.
There's an attempt here to support an ambitious set of requirements, and I applaud the Claude Code team for pushing boundaries on terminal experiences.
However, every one of the tradeoffs I just described around fragility and fighting the emulator is just not my preference as a user.
If I want a scrollable dynamic interface, there is altscreen.
If I want a dynamic viewport below longer history, there are normal `stdout` conventions.
If I need the rewrapped history, I can `/resume` the conversation in a new window.
Heck, even introducing a separate `/rewrap` command would make me happier than a system that constantly fights the terminal emulator for custody of the pixels.

In their design, they've pessimized the wrong thing.
Their initial requirements assumed that rerendering is free, and responsiveness are paramount.
This is incorrect &mdash; the history rerenders have proved to not be free, and I only care about responsiveness in the small section at the bottom that I interact with!

I've found that OpenAI struck a better balance with the Codex CLI design, using a double-buffered history for active vs completed cells.
It brings Ratatui performance with diff-based rendering for free, has zero-overhead thread safety, and the raw speed of a non-GC compiled language.

Full disclosure (full plug at the end), I've been working on a distant fork of the Codex architecture to wrap the Claude agent and other agent choices.
It feels nice using Opus 4.5 without flicker, stuttering, artifacts, or my terminal history getting cleared!

## Some takeaways

Based on these tidbits from the Claude Code team, I imagine they now have the full diff-based TUI rendering engine built out in TypeScript.
I don't know in which areas it's at feature parity, superiority, or inferiority with similar frameworks like Ratatui.
But having seen the general shape and complexity of code that goes into Ratatui, it is a great milestone for the Claude Code team to deliver their own diff-based engine.
Despite the immature reactions online, this was definitely a net positive for Claude Code, and puts them much closer to my performance expectations for a cutting-edge TUI.
While I consider the requirements they've inflicted on themselves to be not my personal cup of tea, I appreciate them experimenting with the limitations of interactivity in the terminal.

There are a few takeaways I'm left with, if I had to offer my remaining 2c (on top of the 98c above):

1. **Why fight the framework:** Every feature that modifies history risks destroying it.
   Terminal users have learned to trust their scrollback as immutable log, and I personally don't like when programs break that trust.
2. **Accidental complexity moves elsewhere:** I still question if rendering a text grid via an object tree (DOM/React) is appropriate for an ANSI terminal.
   With a long chat history, creating or destroying thousands of node objects can easily cause a GC pause, and a frame drop may exhibit a blank screen or partially drawn UI &mdash; more flicker!
3. **Language tradeoffs:** Interpreted languages often justify the performance hit with "portability."
   But in the terminal, the "non-standard environments" (Windows, old Unix distros, Android devices, etc) are *exactly* where you need the fastest performance... because they have the slowest emulators!

Despite the improvements to their architecture, I can't say I would lean on a GC interpreted language like JS for this type of work.[^4]
Clearly they are thinking about some of these concerns, given the acquisition of Bun.
And clearly they are undeterred by the risks, given... The acquisition of Bun.
I'm impressed by the work within the Bun project to date, and it will be interesting to see what their next chapter within Anthropic looks like.
As it relates to Claude Code, this feels kind of like buying more RAM because your program has a memory leak.
However, I have to imagine it's a strategic decision that goes beyond just one product team, and they see a broader need in their portfolio for performant JavaScript runtimes.

---

## P.S., the **Nori** Approach

If you're interested in these topics, or just want a terminal agent that doesn't flicker, check out the work we're doing at [**Tilework**](https://tilework.tech/)!

[Our **Nori CLI**](https://github.com/tilework-tech/nori-cli) is a distant fork of the Codex CLI, with support for Claude Code.
We built this on the philosophy that tools should be fast, intuitive, and respect your terminal's native behavior.
We're working on building the things that make us faster at building the things that make us faster, and tools like this are part of our long term vision to help developers fully own (and enjoy) their own toolbox.

---

## Appendix: Emulator Throughput

[Thanks to Casey Muratori's termbench project!](https://github.com/cmuratori/termbench)

These throughputs are explicitly *not* the output rendered per second;
they are the input "accepted" per second.
Because of this, they provide a guaranteed max on what your terminal could render out,
but do *not* necessarily establish a viable minimum.
For example, COSMIC achieves the top result, but actually exhibits long stutters and freezes throughout the benchmark.

- **ManyLine:** Throughput when printing many short lines.
- **LongLine:** Throughput when printing long lines wrapping the screen.
- **FGPerChar:** Throughput when changing foreground color every character.
- **FGBGPerChar:** Throughput when changing foreground and background color every character.
- **TermMarkV2:** A balanced benchmark simulating complex terminal usage.

All numbers in megabytes per second.
The laptop environment is running Pop!OS 24.04 with a Ryzen 7 6800U.
The desktop environment is running Pop!OS 24.04 with a Ryzen 5 7600X.
The Mac Mini environment is running macOS 26.2 with an Apple M4 CPU.

| Environment | Emulator           | TermMarkV2 | ManyLine  | LongLine   | FGPerChar  | FGBGPerChar |
| ---         | ---                | ---        | ---       | ---        | ---        | ---         |
| Desktop     | **COSMIC**         | **108.8**  | 81.6      | **106.5**  | **196.4**  | **180.6**   |
| Desktop     | **Alacritty**      |   96.6     | **82.1**  | 89.5       |   140.7    |   136.3     |
| Laptop      | **COSMIC**         | **75.0**   |   53.5    | 77.3       | **142.2**  | **127.6**   |
| Mac Mini    | **Ghostty**        | **65.3**   | **82.0**  | **92.3**   | **66.9**   | **34.6**    |
| Laptop      | **Alacritty**      | 65.2       | 49.8      | 63.7       | 113.5      | 103.1       |
| Desktop     | **GNOME**          | 64.1       | 40.0      | 102.6      | 87.4       | 87.2        |
| Desktop     | **Ghostty**        | 60.0       | 57.2      | 75.4       | 49.1       | 51.7        |
| Laptop      | **GNOME**          | 56.2       | 34.4      | **101.6**  | 78.7       | 68.4        |
| Laptop      | **Ghostty**        | 53.7       | **55.2**  | 77.5       | 35.7       | 40.3        |
| Mac Mini    | **Terminal.app**   | 34.7       | 33.1      | 46.6       | 24.3       | 30.2        |
| Laptop      | *Virtual tty3*\*   | *0.3*      | *0.2*     | *5.0*      | *9.0*      | *9.1*       |

> **Notes:**
>
> \* **Virtual tty3**: This benchmark ran on a virtual TTY (`/dev/tty3`) without a windowing system.
> It used the `TermMarkV2 Tiny` profile (in order to complete in under 10 minutes), whereas all other emulators used `TermMarkV2 Normal`.
>
> \** **Highest Throughput**: The highest value for each column within a specific environment is **bolded**.

---

[^1]: As compared to the tricky requirements handled by [HarfBuzz](https://github.com/harfbuzz/harfbuzz) for most web browsers or native apps.
[^2]: These are the historical terms used throughout the Unix documentation. I personally find these terms completely unhelpful to remember what the responsibilities here are, so for this user interface centric discussion I'm just referring to the emulator and process group respectively.
[^3]: If you think this is unlikely, see previous, re: "napkin math".
[^4]: When building low-level developer tools, Rust is to me the much better fit: compile-time thread safety (something something "fearless concurrency"), zero GC, native target optimizations, and indelible boundaries around the unsafe code that necessarily arises with `libc` and `*nix` calls.

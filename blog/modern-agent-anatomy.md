---
slug: modern-agent-anatomy
title: "Modern Agent Anatomy"
authors: csressel
unlisted: true
hide_table_of_contents: true
---

import AgentStackDiagram from '@site/src/components/AgentStackDiagram';
import AgentTurnAnimations from '@site/src/components/AgentTurnAnimations';

:::info
This is the third of three articles on terminology with agents.

1. [Agent is a Terribly Non-Specific Term](/blog/agent-is-not-specific)
2. [The "Hello World" of Agent Development](/blog/agent-hello-world)
3. Modern Agent Anatomy (this article)
:::

<!-- truncate -->

Before naming the parts, I like to think about what boxes I would put on the whiteboard.
If I wanted to just point at what I'm talking about, where does it sit in space?
Relative to the other pieces of the agent stack: all the pieces for an LLM to be used as an agent.

<AgentStackDiagram />

## One turn, in motion

The stack is useful for naming static boundaries. A prompt turn is easier to
understand when those boundaries move: the harness assembles context, asks the
model what to do, executes any requested tools, reduces their results into the
next context, and repeats until the model returns a final response instead of
another tool call.

The following diagram holds one example turn constant: change one line in a
crate README. The harness loads its initial context, calls `grep`, calls `edit`,
then returns a final response. The stack view shows ownership, the sequence view
shows component messages, and the ledger shows the context accumulated for each
later evaluation. A shared phase rail keeps all three views synchronized.

<AgentTurnAnimations />

Notes that are critical to elucidate the agent stack:
  - the three tiers of the harness (RETL, orchestrator, user customizations)
      - the RETL itself (the following or preceeding blog post)
      - orchestrator around the RETL (goal commands, multi agents, approval modes, etc)
      - Martin Fowler, the "inner harness"
      - then the "outer harness" from user (scripts used for hooks, custom tool definitions, skills, repo context)
  - how "harness engineering" blog post coined that term for specifically the outer loop
  - where do multi agent orchestrators fit? where do cloud runtimes fit?

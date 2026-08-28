---
slug: agent-hello-world
title: "The Hello World of Agent Development"
authors: csressel
unlisted: true
hide_table_of_contents: true
---

import RetlCodePlate, { CodexRetlCodePlate } from '@site/src/components/RetlCodePlate';
import HarnessRingsDiagram from '@site/src/components/HarnessRingsDiagram';

["Read eval tool loops."](/blog/agent-is-not-specific) So this aged well! Pretty quickly last year, this RETL concept
was termed the "harness." Then pretty quickly after that, the word harness became meaningless!

:::info
This is the second of three articles on terminology with agents.

1. [Agent is a Terribly Non-Specific Term](/blog/agent-is-not-specific)
2. The "Hello World" of Agent Development (this article)
3. [Modern Agent Anatomy](/blog/modern-agent-anatomy)
:::

Dex Horthy kind of spoke to my soul while he was speedrunning a losing battle on terminology.

<!-- truncate -->

:::twitter
3:18 PM:
> [can we plz settle on what a "harness" is quickly.... i'm tired of this blurry line where ppl use "harness" to mean both the agent and the stuff you build around it](https://xcancel.com/dexhorthy/status/2027478374520865174)

6:15 PM:
> [Yeah well that used to be called “agent” but the word “harness” was made necessary because the saas slop industrial complex broke our terminology by trying to call everything an “agent”](https://xcancel.com/dexhorthy/status/2027522994873286899)

6:58 PM:
> [I actually don’t care what the new word is I just don’t wanna see “harness” get vague-slopped like what happened to “agent”](https://xcancel.com/dexhorthy/status/2027533734120198574)

10:02 PM:
> [yeah after posting this i give up i no longer care](https://xcancel.com/dexhorthy/status/2027580213086114262)
:::

It's a tough task to keep these terms meaningful when there's such a rush of hype and change each month.
As much as I empathize with the fight, I also think losing that battle is for the best.
With language, it's much better to be descriptive than prescriptive.
Easier for terminology to evolve, for useless terms to become useful, and for the messy consensus game of language to give everyone their vote.
The best response to ambiguous terminology is usually to just find more specific terminology.

One example that caught on here is the "inner" vs "outer" harness, a shorthand that spread once [Birgitta Böckeler's harness engineering article](https://martinfowler.com/articles/harness-engineering.html) made the rounds.
Her figure draws the harness as three concentric rings:

<HarnessRingsDiagram />

The inner harness is simply the RETL I've discussed, and the outer harness is anything user-configured: hooks that steer the agent, context engineering within your repo, external orchestration like loop and goal controls.

Given how salient that outer layer is to the SWE community right now — and the simple fact that a lot more people use and customize coding agents than actually build them — I think it's fair that people mostly use "harness" to refer to the outer ring.

This even matches how Dex originally coined harness engineering:

:::twitter
there's a new concept I'm seeing emerging in AI Agents (especially coding agents), which I'll call "harness engineering" - applying context engineering principles to how you use an existing agent

Context engineering -> how context (long or short, agentic or not) is passed to an LLM to get the best results

**You do context engineering when you prompt an llm, and you do a LOT of context engineering when you design a coding agent harness**

But there's another layer on top of the core tool-calling orchestration and agentic RAG that happens in the agent. For claude code, it's the commands, hooks, skills, agents, mcps, etc that a consumer of the tool plugs into the existing harness.

Harness engineering -> How do you engineer the *integration points* of a given agent to get the best results?

**You can't do harness engineering without understanding context engineering, and you can't do context engineering without building intuition around LLMs**

[- Dex Horthy](https://xcancel.com/dexhorthy/status/1985699548153467120) (emphasis mine)
:::

If you, the reader, are interested in those outer topics (defining your own tools, adding an orchestrator that calls individual agents, structuring the context in your repo), it's helpful to understand the inner RETL first. So here's a simple "Hello World" for agentic development: write your own 100-line RETL!

## The Simplest Agent

One thing that strikes me, reviewing a lot of the "related reading" I'll link at the bottom, is how verbose most examples are.
Somewhere between 2,000–4,000 words, and 5–15 chapters...
That's more than you need to grasp the basic code structure!
One project that does it succinctly is [nanoAgent](https://github.com/sanbuphy/nanoAgent), which fits the whole loop in about a hundred lines:

```py
import json, os
from openai import OpenAI
client = OpenAI(...)
tools = [...]
def execute_bash(command): ...
def read_file(path): ...
def write_file(path, content): ...
functions = {...}
# Full defs: https://github.com/sanbuphy/nanoAgent/blob/main/agent.py

def run_agent(user_message, max_iterations=5):
    # 1. Read
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Be concise."},
        {"role": "user", "content": user_message},
    ]
    for _ in range(max_iterations):
        # 2. Eval
        response = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=messages,
            tools=tools,
        )
        message = response.choices[0].message
        # (additional reads)
        messages.append(message)
        if not message.tool_calls:
            return message.content
        # 3. Tool
        for tool_call in message.tool_calls:
            name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            print(f"[Tool] {name}({args})")
            if name not in functions:
                result = f"Error: Unknown tool '{name}'"
            else:
                result = functions[name](**args)
            # (additional reads)
            messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": result})

        # 4. And then loop!
    return "Max iterations reached"

if __name__ == "__main__":
    import sys
    task = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Hello"
    print(run_agent(task))
```

:::tip
If this control flow is still unclear, continue to [part three!](/blog/modern-agent-anatomy)

There is a much more visual diagram of control flow, showing how the LLM API calls sequence with the tool calls, and how the reads build up the full context window.
:::

## More Examples

Does this hold up in the real world?
Surely advanced harnesses like Codex and Claude Code are doing something completely different?
Well... a little bit of extra control flow, but fundamentally the same core steps.
Production harnesses add retries, hooks, streaming, compaction, queues, and
telemetry around that loop. Those concerns complicate its control flow, but it's
the same underlying recurrence.

So let's pull from two open-source harnesses, and annotate what best-in-class looks like!

### pi: a minimal agent harness

In `pi-agent-core`, one nested control structure owns most of the sequence. The
outer frame contains the other three phases, while the shaded lines show where
data crosses each boundary:

<RetlCodePlate />

### Codex: the harness powering OpenAI

Codex documents `run_turn` in the same terms: a model response can contain
function calls and assistant messages. Function-call outputs are sent back in
the next sampling request, and a response containing only assistant messages
completes the turn. The difference is that Codex distributes that sequence
across helpers instead of keeping it in one block.

`run_turn` records queued input and clones conversation history for the prompt.
The sampling helpers build the advertised tool set and stream the model API.
Completed response items are classified into tool calls, dispatched through
`ToolCallRuntime`, and recorded back into conversation history. Finally,
`model_needs_follow_up || has_pending_input` is the normal continuation signal,
while stop hooks and recovery paths can override that route.

<CodexRetlCodePlate />

## Try It Yourself

These production versions show that the same simple architecture holds up, even after all the real operational concerns get built in.
Just to start though, the smallest implementation fits all four phases in under a hundred lines of Python or TypeScript! So try writing that 100-line control flow from scratch :)

If the blank canvas gives you anxiety, ask your Codex or Claude (or Nori!) agent to write the shortest snippet that calls the completions API using your local auth; you can build up more from there with no libraries required.
The only thing absent from this guide is what the actual tool call looks like when returned from the model API.
Pi's source code is particularly instructive here, but try just debug printing the JSON-serialized output! You'll quickly identify the structure, whether that's a `tool_call` or `function_call` or `functioncall` or other.

After you've seen a basic loop running, you can play around with all the extensions!
Steering messages, tool call hooks, approval flows... Or go poke at these same choices in an extensible open source harness, like the [Nori harness](https://github.com/tilework-tech/nori-cli) or [Pi](https://pi.dev/).

Hello world, for your agent!

:::tip
Don't know where to start? Pipe this article into your agent of choice (`claude`, `codex`, `nori`, ...) as a lesson plan:

```bash
curl -s https://clifford.ressel.fyi/blog/agent-hello-world.md | claude "Use this article as a lesson plan to teach me to build a tiny agent, in my choice of Python or TypeScript. Start me from a bare completions API call using my local auth, and build up to the 100-line RETL. Then have me add tools one at a time, ordered by safety: store/recall key-value pairs, read/write files under /tmp, and finally whitelisted bash commands. Guide me step by step, and let me write the code myself."
```
:::

---

Related Reading:

- [nanoAgent](https://github.com/sanbuphy/nanoAgent/)
- [Building Effective Agents (Anthropic)](https://www.anthropic.com/engineering/building-effective-agents)
- [Designing Agentic Loops (Simon Willison)](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)
- [How to Build an Agent (Amp)](https://ampcode.com/notes/how-to-build-an-agent)
- [mini-swe-agent](https://mini-swe-agent.com/latest/)
- [Harness Engineering (OpenAI)](https://openai.com/index/harness-engineering/)

---
slug: agent-is-not-specific
title: "Agent is a Terribly Non-Specific Term"
authors: csressel
---

While there's still a chance to throw more terminology at the wall, I think we could do better.

:::info
This is the first of three articles on terminology with agents.

1. Agent is a Terribly Non-Specific Term (this article)
2. [The "Hello World" of Agent Development](/blog/agent-hello-world)
3. [Modern Agent Anatomy](/blog/modern-agent-anatomy)
:::

I think that there are more specific names we have yet to hit on, for this year's applications of generative AI.
Not only are more specific names possible, they are very useful when communicating between engineers, or coming up with useful specifications for projects. Imagine that every time you wanted to deploy software in 2015, another engineer on your team asked if it was going to "the cloud." Not asking if it's going into a Docker container, or running on bare metal on EC2, or using that new tool "kubernetes," but literally asked "hey have you gone to the cloud yet." It would be pretty difficult to have a meaningful engineering conversation about what you've implemented.

<!-- truncate -->

That's the way I feel about the word "agent."
**Particularly in engineer-to-engineer conversations.**
So far the only commonality I've seen in the definition of "agent" has been: "thing I trust at least a little bit to do something."
It's essentially a definition by absentia; if it does anything more than just spit text back at you, call it an agent.
As a result, when engineers and founders use this term in a technical context I don't get a clearer sense for their concept.

Here's an example of how this could be done better: so-called "coding agents" like Claude Code and Cursor and the rest could be much better termed **RETLs: read eval tool loops**. This is obviously based on a REPL, which is a read eval print loop. However, in this use case the order of operations is:

- **Read**: user input, previous outputs, MCP for tools, etc; add anything to the prompt or context
- **Eval**: model inference
- **Tool**: if the result declares a tool then call it
- **Loop**: if we haven't declared completion then go to the start

These RETL tools are often put in the category of "synchronous agentic coding." Likewise, there will need to be terminology for architectures in the asynchronous category. In the agentic coding space, these would be the products currently explored by Devin and Factory and similar.

I've noticed that this second model is architecturally very similar to [coroutines](https://en.wikipedia.org/wiki/Coroutine), where each model is a program, and the suspend/resume is determined by explicit delegation of control to a model, which can `yield` back to the caller, or `yield from` another model or models (or "sub-agents"... there's that word again!), or lastly can use another model in a blocking manner.
But I'm not the one with the frame of reference to name things in that space, and I certainly don't know the ins and outs of useful terminology that was already coined in the AI research world, like multi-agent systems, agent-based model, ACTOR model, etc.

However, after working pretty extensively with open source RETLs like [OpenCode](https://opencode.ai/) and [Codex](https://github.com/openai/codex) and others (as a power user, but also to rewrite parts of the tools for my own use) I've noticed that the confines of a very common architectural pattern has emerged around the RETL definition above.
The RETL definition isn't just a common trend within the flurry of agentive product releases this year, it's both the necessary and the complete set of behaviors that describe these products!
Admittedly for a broad definition of "tool," that encompasses MCP servers and sub-RETLs and many other, weirder tools.

If there are other terms that fill this gap already, please let me know!
I've heard of "reflection loops," but that seems to be a prompting technique (equivalent to "self-critique").
The most common term I've heard for Cursor/Claude Code/Codex/OpenCode is either "AI tools" or "coding agents" the first of which fails to distinguish from tab completion and the second of which fails to distinguish from the asynchronous architectures I mentioned above.
So in the meantime, I'll be name-droppinng RETL to reference these products, <!-- At least until someone more knowledgeable brings out the Mean Girls quote on me: 'Clifford, stop trying to make "RETL" happen, it's not going to happen.' --> and we'll see over time what conensus emerges on the bounds of one architecture vs another.


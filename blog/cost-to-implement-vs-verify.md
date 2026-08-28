---
slug: cost-to-implement-vs-verify
title: "Cost to Implement vs Cost to Verify"
authors: csressel
---

# Cost to Implement vs Cost to Verify

## The Wrong Scoreboard

The discourse on coding agents has been obsessing for the past year over the wrong question. The main focus has been *what models can do*: lines written, autonomous minutes, benchmark scores, model cards, percent of lines shipped by AI.
These are all generalized measures of **implementation throughput**.
Useful for a bird's-eye view of model progress, but they say almost nothing about where the actual bottlenecks now live.
The operative question for practitioners in 2026 is not what tools *can* do, it's what you *should ask* them to do.

<!-- truncate -->

Answering the *should* question requires a different lens than the capability benchmarks provide.
Every task you might hand to a coding agent has two costs that matter: the **cost to implement** (C<sub>i</sub>) — the time and expertise needed to produce the code — and the **cost to verify** (C<sub>v</sub>) — the time and expertise needed to confirm the code is correct.
The relationship between these two variables determines whether delegation is a net win or a liability.

## Aside: About "Delegation"

When I first outlined this in November 2025, I was comparing handcoded vs AI-delegated implementations.
My workflow has changed significantly since then: I rarely hand-write code.

The relevant choice for me is now between pair programming with the agent (high-touch, Socratic, every structural decision is guided) and delegating (agent leads research, planning, and implementation; you just review the output of each phase).
The pair programming model is mentally just as involved as writing code, but mechanically faster.
The delegation model is now very different, allowing you to run and ship five separate feature PRs in parallel (not some clickbait Xitter "I ran 100 agents in parallel today" make-work slop, but five actual product increments, in parallel, in a brownfield codebase).

Whatever the threshold of delegation is, in my experience the framework below applies.

---

## The Two-Variable Framework

<svg viewBox="0 0 520 480" xmlns="http://www.w3.org/2000/svg" style={{maxWidth: '520px', width: '100%'}}>
  <style>{`
    text { font-family: 'Libre Baskerville', 'Georgia', serif; }
    .axis-label { font-size: 13px; fill: currentColor; }
    .quadrant-label { font-size: 14px; fill: currentColor; }
    .axis-title { font-size: 13px; fill: currentColor; }
  `}</style>

  <defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="currentColor" opacity="0.5" />
    </marker>
    <pattern id="dangerHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#8b3a3a" strokeWidth="1.5" opacity="0.12" />
    </pattern>
  </defs>

  {/* Axes */}
  <line x1="80" y1="400" x2="490" y2="400" stroke="currentColor" strokeWidth="1.5" opacity="0.4" markerEnd="url(#arrowhead)" />
  <line x1="80" y1="400" x2="80" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.4" markerEnd="url(#arrowhead)" />

  {/* Midlines */}
  <line x1="285" y1="30" x2="285" y2="395" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4,4" opacity="0.2" />
  <line x1="85" y1="210" x2="485" y2="210" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4,4" opacity="0.2" />

  {/* The Trap — hatched fill */}
  <rect x="285" y="30" width="200" height="180" fill="url(#dangerHatch)" />
  <rect x="285" y="30" width="200" height="180" fill="none" stroke="#8b3a3a" strokeWidth="1.5" opacity="0.3" strokeDasharray="6,3" />

  {/* Axis titles */}
  <text x="290" y="430" textAnchor="middle" className="axis-title">{"Cost to Implement"}</text>
  <text x="35" y="210" textAnchor="middle" className="axis-title" transform="rotate(-90, 35, 210)">{"Cost to Verify"}</text>

  {/* Low/High markers */}
  <text x="182" y="418" textAnchor="middle" className="axis-label" style={{opacity: 0.5, fontSize: '11px'}}>{"low"}</text>
  <text x="390" y="418" textAnchor="middle" className="axis-label" style={{opacity: 0.5, fontSize: '11px'}}>{"high"}</text>
  <text x="68" y="310" textAnchor="middle" className="axis-label" style={{opacity: 0.5, fontSize: '11px'}} transform="rotate(-90, 68, 310)">{"low"}</text>
  <text x="68" y="120" textAnchor="middle" className="axis-label" style={{opacity: 0.5, fontSize: '11px'}} transform="rotate(-90, 68, 120)">{"high"}</text>

  {/* Quadrant labels */}
  <text x="182" y="115" textAnchor="middle" className="quadrant-label">{"Build your mental model"}</text>

  <text x="390" y="100" textAnchor="middle" style={{fontSize: '18px', fontWeight: 'bold', fill: '#8b3a3a', fontFamily: 'Libre Baskerville, Georgia, serif'}}>{"The Trap"}</text>
  <text x="390" y="125" textAnchor="middle" className="quadrant-label" style={{fontSize: '11px', opacity: 0.6}}>{"huge incentive, blind verification"}</text>

  <text x="182" y="310" textAnchor="middle" className="quadrant-label" style={{opacity: 0.4}}>{"Doesn't matter"}</text>

  <text x="390" y="310" textAnchor="middle" className="quadrant-label">{"Delegate freely"}</text>

  {/* Arrow showing Cᵢ compression */}
  <line x1="420" y1="350" x2="180" y2="350" stroke="currentColor" strokeWidth="2" opacity="0.3" markerEnd="url(#arrowhead)" />
  <text x="300" y="375" textAnchor="middle" style={{fontSize: '10px', fill: 'currentColor', opacity: 0.5, fontStyle: 'italic', fontFamily: 'Libre Baskerville, Georgia, serif'}}>{"models compress Cᵢ"}</text>
</svg>

When both costs are low, it doesn't matter what approach you take — the task is trivial either way. When C<sub>i</sub> is high but C<sub>v</sub> is low, delegate freely; the implementation is a job for the agent, and you can cheaply confirm the result. The inverse is equally clear: when C<sub>i</sub> is low but C<sub>v</sub> is high, build a detailed mental model by taking part in every step of the process.

The dangerous quadrant is top-right.
When both costs are high, there's a huge incentive to spin the slot machine many times, and see if the agent just happens to nail the task.
Compared to hand coding, where you burn days or weeks to ascertain the quality, the agent might have a chance to succeed at the same or higher quality after just 60 minutes of work.
For complex or off-distribution work, it may be a small chance... but that makes it even more tempting!

By skipping the mental effort, you go in blind on an equally demanding task: verification.
This is the trap.
The models have dramatically compressed C<sub>i</sub> across the board. C<sub>v</sub> has not moved at the same rate — and in many cases, without careful developer intervention, it has gotten worse.

---

## Vibecoding and the Unaddressed Variable

Vibecoding is the logical extreme of treating C<sub>i</sub> as the only variable.
Previously, architecture decisions were bottlenecked by implementation cost. Releasing that constraint completely, without addressing verification cost, is a big failure mode. Any frequent flyer on Claude Code has experienced this, as an end user of an entirely AI-coded application — the constant issues with UI bugs, unintended changes to history cells, broken permission models...
I've written about the [flickering issues](./drawing-monospace-text) before, and I've been annoyed that sandboxing persistently [pollutes](https://github.com/anthropics/claude-code/issues/16022) [the](https://github.com/anthropics/claude-code/issues/17727) [workspace](https://github.com/anthropics/claude-code/issues/28189) [with](https://github.com/anthropics/claude-code/issues/29316) [empty](https://github.com/anthropic-experimental/sandbox-runtime/issues/139) [files](https://github.com/anthropic-experimental/sandbox-runtime/issues/85) (this issue has been recurring in different forms for three months now).
Users of the Claude Web environment, of Cursor, and many other almost fully AI-coded products experience the exact same degradation of quality as the software grows so rapidly.
It's not just that more features lead to proportionately more bugs. When you don't build a mental model of the codebase, you've skipped your first pass on verifying the logic, and you've gone without a map of what parts need verification.
The consequence isn't just bugs — it's **verification blindness**: you don't know what you don't know.

This is a common failure mode that many teams have fallen into, particularly startups that feel the keenest urgency to ship faster.

---

## Verification Debt

As a result, the most common form of tech debt in these highly agentic codebases comes from growing your feature surface area too fast and too loose.
Every agentic feature shipped without a corresponding verification investment degrades your ability to autonomously ship *future* features.
This is a compounding liability, not a fixed cost — first it accumulates, and then because these changes can have cross-cutting technical concerns, or act as bad examples for future work, it compounds.
Unit and integration testing become slightly more important, to compensate.
But **E2E behavioral verification becomes far more important**, because that's the layer the agent generally cannot self-evaluate on its own.
Skipping this investment creates **verification debt**.

---

## Detour: What Spec-Driven Development Gets Right (and Wrong)

The popular framing of spec-driven development is wrong on two counts. It's not about making prompt copy-paste easier, and it's not about closing the loop on "Ralph Wiggum" workflows — generate, test, regenerate. These framings chase short-term speedups that don't touch the real bottleneck.

The **original insight** of a specification is much more important: you cannot verify an implementation if you don't know its *intent*. A specification is the textual or symbolic description by which different readers arrive at the same mental model. In distributed teams, software has long relied on PR review, ADRs, box and sequence diagrams — this is fundamentally the *sharing of intent*. You must know the developer's intent before you can review their outputs. This is not new, it's just now more urgent.

The genuine unlock of specs is that they **literalize the behavior you need to verify**. Once combined with simulation environments — headless browsers, terminal puppeteering, API smoke tests — your specs become the instructions for agentic verification *after* agentic implementation. The loop closes not at the generation layer, but at the verification layer.

---

## Beware Reflexivity

These two variables don't stay independent — they affect each other over time. Shipping too quickly *raises* C<sub>v</sub> as verification debt accumulates. Higher C<sub>v</sub> in turn *raises* future C<sub>i</sub> — the agent's implementation speedup erodes as the codebase becomes harder to reason about, harder to test against, and bad patterns get committed and cargo culted. This is the mechanism by which agentic coding gains can crash down to earth, trash a codebase, and turn a team against AI coding tools entirely.

But reflexivity runs both ways. The virtuous path runs in the opposite direction: to properly ship faster, teams must **aggressively use the low cost to implement new tooling as a lever to decrease the cost of verification**.

---

## Solutions: Making Verification Tractable

Three concrete approaches, in increasing specificity:

**1. Simulation environments at full breadth**.
- Standard integration/automation/E2E testing practices are table stakes, but the agent's reach is now wider.
- Headless browsers, Chrome DevTools protocol, pseudo terminals, API smoke tests, microVMs, containers — the agent can drive all of these.
- The question is no longer *can we automate this* but *have we specified what to automate*.

**2. Making the runtime legible**.
- E2E tests don't capture everything: service startup timing, internal program state, functional SLAs, "no UI interaction blocks for more than 2s".
- An ephemeral, per-worktree observability stack — logs, metrics, traces — makes runtime behavior tractable to the agent.
- This is the difference between the agent knowing the tests pass and the agent understanding *how the system is behaving*.

**3. Bespoke verification tooling is now nearly free**.
- Personal example: while building a PTY proxy around several TUI tools, codifying system invariants and nightly fuzzing jobs cost only ~two extra hours.
- I implemented fuzzing with reproducible seeds and system state captures at failure.
- I can put my tool through more comprehensive testing than I could have ever justified without the agentic contributions.
- The economics of verification tooling have shifted — the agent makes it cheap to build guardrails and course correction, so the only remaining question is where those guardrails should go.

---

## The New Discipline

Coding agents haven't changed what good software engineering is, but they have changed where the *leverage* point is.
The developers extracting the most durable value from these tools are the ones who have reinvested implementation gains into verification infrastructure.
The question to ask before every agentic task is *not* "can the agent build this?" but "how will I verify what was built?"

If you want two immediate, concrete steps to improve your verification tools:
- After you run through a cycle of research-plan-implement, your agent must go through the implementation using TDD.
  [Here's a general purpose agent skill to do so](https://noriskillsets.dev/skills/test-driven-development).
- If you want an agent to go through a manual end-to-end test on your project, consider giving it the tools to interact directly.
  [Here's a skill for the agent to puppet a browser with Playwright](https://noriskillsets.dev/skills/webapp-testing). [Here's a skill for the agent to puppet a TUI with tmux](https://noriskillsets.dev/skills/tui-puppeteering-with-tmux).

I am hoping that this will be just the first of three core posts about the new practices in software engineering.
To signpost properly where I think this is going, here are the three ideas that are changing how I think about software development:

1. **Verification debt**. *(this post)*
2. **Agent legibility**.
3. **Compounding correctness**.

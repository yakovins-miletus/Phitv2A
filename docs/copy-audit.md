# Copy audit — `src/shared/content.ts`

**Nothing here has been changed.** Marketing copy carries factual claims about your
clients, your people and your numbers, and I don't have the facts to invent replacements.
Every suggestion below is a proposal for you to accept, reject or rewrite.

## The standard being applied

Not my taste — the file's own contract, `content.ts:6-13`:

> **L0 `gunshot`** — one claim, ≤12 words, **carries a number or a named specific**.
> **L1 `tracer`** — 25-40 words naming the mechanism or the evidence that makes L0 survivable.

That is a good rule. Roughly **56 %** of the file already meets it, and where it does the
copy is genuinely strong:

- `content.ts:26` — *"We took two milliseconds down to eighteen microseconds."*
- `content.ts:36` — *"Established International Presence"*
- `content.ts:45` — *"Six open roles. One intake a year."*
- `content.ts:105` — `{ value: 100, suffix: "x", label: "Latency improvement", caption: "HFT pipeline · 2ms → 18µs" }`
- `content.ts:202` — *"Petabytes of ticks in. One tradeable signal out."*

The other ~44 % is interchangeable with any consultancy's site. The file reads as two
different writers: one who knows the business, and one reaching for adjectives. The
findings below are all from the second.

---

## 1. The tagline is used twice, and says nothing — `content.ts:17` and `:386`

```ts
hero:    { tagline:   "Making tomorrow's technology available today" }
closing: { statement: "Making tomorrow's technology available today" }
```

This is the single most prominent line on the site — it is the home hero — and it is also
the closing statement. Two problems:

1. **It is generic.** It could belong to a printer manufacturer, an ERP vendor, or a
   telecoms reseller. It contains no number, no named specific, and no mechanism. By the
   file's own L0 rule it fails outright.
2. **Reusing it as the closing statement** wastes the last impression. A reader who
   finishes the page is told the same nothing they were told at the top.

**Suggested direction** — the material for a real hero line is already in the file
(`:26`, `:105`): a latency claim is specific, verifiable, and unmistakably yours. Something
in the shape of *"Two milliseconds to eighteen microseconds."* would meet L0 in six words.
For the closing, use a different line entirely — a closing statement should resolve, not
repeat.

**Cost of leaving it:** high. It is the first and last thing every visitor reads.

---

## 2. `culture` is five adjectives — `content.ts:245-251`

```ts
culture: [
  "Critical Thinking", "Bold Innovation", "Proactive Communication",
  "Technical Excellence", "Seamless Teamwork"
]
```

Five values, none of which any company would disclaim. No competitor would list
"Uncritical Thinking" or "Timid Stagnation", so the list carries zero information — and
"Bold Innovation" and "Seamless Teamwork" are both on the buzzword list.

**Suggested direction:** replace each abstraction with a practice a candidate could
actually observe. *"Bold Innovation"* → the pet-project time you already describe on
`/innovation-hub`. *"Seamless Teamwork"* → the follow-the-sun handover already described
at `:36`. You have the specifics elsewhere in the same file; this array just doesn't use
them.

**Cost of leaving it:** medium — it is on a careers surface, read by the candidates you
most want.

---

## 3. Partnership blurbs stack buzzwords — `content.ts:237` and `:242`

`:237` — three in one sentence:
> *"We arm their researchers and portfolio managers with **elite** infrastructure, data
> science pipelines, and **cutting-edge** software engineering, so math-driven strategies
> deploy **seamlessly** across global markets"*

`:242`:
> *"Their specialized data lakes and computing environments **supercharge** our quant
> pipelines, processing complex financial datasets with **maximum efficiency and minimal
> friction**"*

Strip the adjectives from `:237` and the residue is "we give them infrastructure,
pipelines and software" — true of every vendor. `:242` says the partner's computers make
your computers faster.

**Suggested direction:** one number each. What scale of data lake? What did the pipeline
do before and after? The `:105` impact block proves you have these numbers.

**Cost of leaving it:** medium.

---

## 4. `principles.valueToClient` is four flavours of reassurance — `content.ts:71-95`

| Value | The promise |
|---|---|
| Integrity | *"A foundation of trust and predictability"* |
| Accountability | *"Reliability and peace of mind"* |
| Forward Thinking | *"A competitive edge"* |
| Excellence | — |

Plus `:90`, a stock phrase verbatim:
> *"We don't just solve today's problems; we anticipate tomorrow's"*

**Suggested direction:** the `definition` lines are noticeably better than the
`valueToClient` lines — the definitions describe behaviour, the promises describe feelings.
Either cut `valueToClient` entirely and let the definitions stand, or replace each with a
commitment that could be broken (a response time, a reporting cadence, a named guarantee).
A promise that cannot be broken is not a promise.

**Cost of leaving it:** low-to-medium.

---

## 5. Scattered single buzzwords

| Line | Text | Note |
|---|---|---|
| `:64` | *"backed by **elite** investors … the **explosive** potential of the AI era"* | Two in one sentence. "Backed by investors across the USA, Europe and Hong Kong" is already the stronger claim — the adjectives dilute a real fact. |
| `:68` | *"Manila's **elite** technology talent"* | Third use of "elite". |
| `:271` | *"…and the **breathtaking** interfaces that sit on top of them"* | In a **job description**. Candidates read job descriptions for scope and stack. |
| `:312` | *"**bleeding-edge** cloud … in the AI era, **standing still is the only losing move**"* | LinkedIn-post register, inconsistent with the quant-noir voice the file's own docstring specifies. |
| `:367` | *"distilled into **robust** trading signals"* | "Robust" is doing no work; the sentence is strong without it. |

Full buzzword scan across `content.ts`, `sections.ts` and `careersData.ts`: **21 hits** —
`elite` ×3, `scalable` ×3, `robust` ×2, plus `supercharge`, `seamlessly`, `Seamless`,
`mission-critical`, `innovation`, `Innovation`, `explosive`, `cutting-edge`,
`breathtaking`, `bleeding-edge`, `world-class`, `state-of-the-art`, `elevate`.

---

## 6. A structural oddity, not copy — `sections.ts:28-30`

The file documents it itself:

> `closing` — *"is never rendered as a section at all. It survives because EyeFlow draws
> one rail dot per entry"*

A data entry that exists only to make a decoration's count come out right. Worth a
follow-up: either give `EyeFlow` its own count, or let the rail have one fewer dot.

---

## Summary

| # | Item | Lines | Priority |
|---|---|---|---|
| 1 | Tagline: generic, and used twice | `:17`, `:386` | **High** |
| 2 | `culture`: five undisclaimable adjectives | `:245-251` | Medium |
| 3 | Partnership blurbs: 3 buzzwords, 0 numbers | `:237`, `:242` | Medium |
| 4 | `valueToClient`: unbreakable promises | `:71-95` | Low-Med |
| 5 | Scattered buzzwords (21 total) | various | Low |
| 6 | `closing` exists only to feed a decoration | `sections.ts:28` | Low |

**The one worth doing first is #1.** The rest is polish; the tagline is the site's first
and last sentence, and the specific claim that would replace it is already sitting nine
lines away at `content.ts:26`.

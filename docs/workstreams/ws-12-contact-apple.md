# WS-12 — Contact: fewer surfaces, more air

**Owner files (exclusive):** `src/routes/contact.tsx` · `src/features/contact/**`
**Depends on:** WS-01 for tokens only. ⚠️ **WS-01's `MuiCard` flatten will not fix this
page** — its panels are hand-rolled `Box` surfaces, not `<Card>`. This workstream removes
them itself.
**Agents:** Haiku to map the form + mutation wiring, Sonnet to implement.
**Acceptance bar:** `/design-taste-frontend`.

---

## Why

The brief: *"try also slightly make the contact us page look more like Apple."*

Screenshot 4 shows the gap. The page is two heavy panels side by side. Inside the left one,
every field is a **filled grey box with its own border and radius** — four stacked
rectangles before you reach a fifth rectangle that is the submit button. Inside the right
one, `GENERAL & PARTNERSHIPS` and `CAREERS & GRADUATE FELLOWSHIPS` each get *another*
nested filled box. It is boxes inside boxes inside boxes, and the eye has no idea what
matters.

**What "like Apple" actually means here** — state it plainly, because this is the
instruction most likely to be misread into gradients and glassmorphism:

- Restraint, not chrome. **Fewer** surfaces, not prettier ones.
- Generous, consistent vertical rhythm doing the grouping that borders do today.
- Type hierarchy carrying the structure — one confident heading, quiet supporting text.
- Exactly one obvious primary action.
- Inputs that recede until focused.

## Current state (verified)

| File | Lines |
|---|---|
| `src/routes/contact.tsx` | 177 |
| `features/contact/components/ContactForm.tsx` | 286 |
| `features/contact/components/ContactFAQ.tsx` | 288 |
| `features/contact/components/EcotowerMap.tsx` | 87 |

Page composes: `ContactForm` · `EcotowerMap` · `ContactFAQ` · `NextStepsTimeline`.
The form is a real mutation — `tests/contact-mutation.test.tsx` covers it and must keep
passing. **Do not break submission while restyling.**

**The surfaces are hand-rolled, which is why the theme can't reach them:**

- `contact.tsx:102-105` — the right panel: `borderRadius: "24px"`,
  `border: 1px solid alpha(NOIR.ink, 0.12)`, `bgcolor: "background.paper"`.
- `contact.tsx:133` and `contact.tsx:144` — the two nested direct-channel boxes, each with
  its own `p: 2`, `borderRadius: "12px"`, `bgcolor: alpha(NOIR.ink, 0.03)` **and** its own
  border. These are the boxes-inside-a-box.
- `contact.tsx:126, 157` — `borderTop` dividers already doing grouping work that spacing
  could do alone.
- `ContactForm.tsx:17-32` — `lightTextFieldSx`, the shared field style. One object; changing
  it restyles every field at once.

**Correction to a common assumption:** the fields **do** have real labels —
`ContactForm.tsx:188, 200, 213, 225` pass `label="Name" / "Email" / "Subject" / "Message"`
to MUI `TextField`, which associates them properly. Screenshot 4 shows floating labels at
rest, not placeholders. So the a11y floor below is about *preserving* what exists, not
adding it.

## Target state

- **Two panels → one column.** Let the form and the "What happens next" / direct-channels
  content flow in a single measured column, or keep two columns without the panel surfaces
  around them. The panels go either way.
- **Fields lose their boxes.** Hairline underline beneath each input, label above or as a
  floating label, generous space between fields. Focus brings the accent in — that is when
  the field earns visual weight, not at rest.
- **Direct channels stop being nested boxes.** `info@phitopolis.com` and
  `jobs@phitopolis.com` become plainly-set links under quiet mono labels.
- **One primary action.** `Send Message` is currently a full-width dark slab — keep it
  unmistakable but let it be a button, not a fifth rectangle in a stack of rectangles.
- The bulleted "What happens next" timeline is the strongest thing on the page already.
  Keep its structure; give it room.

## ⚠️ Accessibility floor — do not regress it

Removing field borders is where contact forms usually break:

- Keep the existing MUI `label` props (`ContactForm.tsx:188-225`). If you move to a custom
  underline treatment, the label association must survive the change — verify in the
  accessibility tree, not by eye.
- The focus indicator must be clearly visible and must not rely on colour alone.
- Required-field marking and error messaging must survive; errors must be announced, not
  merely coloured.
- Underlines must clear 3:1 against the page ground as non-text UI.

## Steps

1. Map `ContactForm.tsx` — the mutation, validation, and error rendering
   (`RULES` at L34-36, validation at L67-72). Restyling must not touch that logic.
2. Restyle fields via `lightTextFieldSx` (`ContactForm.tsx:17-32`) to underline-at-rest,
   accent-on-focus. One object, every field — do it there, not per-field.
3. Remove the panel surface at `contact.tsx:102-105`.
4. Un-nest the direct-channel boxes at `contact.tsx:133` and `:144` — plain links under
   quiet mono labels.
5. Replace the `borderTop` dividers (`contact.tsx:126, 157`) with spacing.
6. Re-space the whole page — the vertical rhythm becomes the only structure left, so it has
   to be deliberate rather than inherited.
7. Review `ContactFAQ` and `NextStepsTimeline` for the same nesting habit.

## Verification

```bash
cd " Master P Frontend/Phitv2A" && yarn typecheck && yarn test && yarn build && yarn preview
```

- `tests/contact-mutation.test.tsx` passes — **submission still works.**
- Submit the form against a running Heimdall; confirm success and error paths render.
- Keyboard-only: tab through every field, focus visible at each stop, submit via keyboard.
- Screenshots at 375 / 768 / 1440, light and dark.
- Focus-state screenshot of a single field — the resting/focused difference must be obvious.
- Contrast: text ≥4.5:1, field underlines and focus rings ≥3:1.
- Count surfaces on the page. If it's still more than one or two, the workstream isn't done.

## Out of scope

Contact form backend, email routing, and the Heimdall mutation endpoint. `EcotowerMap`'s
map behaviour (restyle its frame only). Theme tokens (WS-01).

# Semantic Compression

Compress text for LLM prompts by removing grammatical scaffolding while preserving meaning.

**Principle**: LLMs reconstruct grammar from content words. Remove predictable glue; keep semantic payload.

## Deletion Tiers

### Tier 1 — Always Delete
- Articles: a, an, the
- Copulas: is, are, was, were, am, be, been, being
- Expletive subjects: "There is/are...", "It is..."
- Complementizer: that (as clause marker)
- Pure intensifiers: very, quite, rather, really, extremely
- Filler phrases: "in order to" → to, "due to the fact that" → because
- Infinitive "to" before verbs (unless it prevents noun/verb confusion)

### Tier 2 — Delete Unless Meaning Changes
- Auxiliary verbs: have/has/had, do/does/did, will/would
- Modal verbs: can/could/may/might/should (keep must/must not)
- Pronouns: it/this/that/these/those/he/she/they (drop when referent obvious)
- Relative pronouns: which, that, who, whom
- Prepositions: of, for, to, in, on, at, by

### Tier 3 — Delete Only If Relation Still Clear
- Remaining prepositions: with/without, between/among, within, after/before, over/under, through
- Redundant adverbs: "shout loudly" → "shout"

## Always Preserve

- Nouns, main verbs, meaning-bearing adjectives/adverbs
- Numbers, quantifiers: "at least 5", "more than"
- Uncertainty markers: "appears", "seems", "reportedly"
- Negation: not, no, never, without
- Causality: because, therefore, despite, although, if, unless
- Requirements: must, required, prohibited, allowed
- Proper nouns, technical terms

## Examples

| Original | Compressed |
|----------|------------|
| The system was designed to efficiently process incoming data | System design: efficient process incoming data |
| It is important to note that X should not be done | X: should not do |
| The researcher made a decision to investigate | Researcher decided: investigate |
| Please ensure that you have completed all of the required fields | Complete all required fields |

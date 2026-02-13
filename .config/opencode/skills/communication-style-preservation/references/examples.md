# Before/After Examples: Communication Style Preservation

This file demonstrates how to preserve the user's unique bilingual French/English style while improving message structure and clarity.

## Example 1: Asking for a Code Review

### Before (Generic AI style)
> Hello @john, I have created a pull request for the feature we discussed. The PR is #1234. Could you please review it when you have a chance? Let me know if you need any clarification. Thank you.

### After (User's style)
> J'ai créé la PR pour le feature dont on a parlé. C'est la PR #1234 dans le repo backend.
>
> Je suis preneur si tu peux regarder @john 🙏
>
> Ça devrait être assez simple, y a pas grand chose de compliqué. Dis-moi si tu as besoin de plus de contexte.

**Preserved elements:**
- Bilingual: French base, English terms (PR, feature, repo, backend)
- Casual-professional: "je suis preneur", "y a pas grand chose de compliqué"
- Structure: Context → technical details → request → sign-off
- Emoji: 🙏 for request
- @mention included

---

## Example 2: Reporting an Issue

### Before (Generic AI style)
> I noticed an issue with the deployment. The API is returning 500 errors when I try to access the endpoint. I have included logs below. Could you investigate? The error seems to be in the authentication module.

### After (User's style)
> Y a un souci avec le deployment de ce matin. L'API renvoie des 500 sur l'endpoint `/api/auth`.
>
> Voici les logs :
> ```
> [ERROR] Authentication failed for user
> ```
>
> Je capte pas trop ce qui se passe, ça marchait bien avant 😅
>
> Tu peux regarder @sarah ? J'ai l'impression que ça vient de l'auth module.

**Preserved elements:**
- Bilingual: French base, English terms (deployment, API, 500, endpoint, logs, auth module)
- Casual-professional: "y a un souci", "je capte pas trop"
- Structure: Context → technical details with logs → question → @mention
- Emoji: 😅 for self-deprecation
- Specific technical context (endpoint path, error type)

---

## Example 3: Providing an Update

### Before (Generic AI style)
> I have finished implementing the feature for ticket RD-4450. All tests are passing and the code is ready for review. The implementation includes the requested changes to the data model. Please let me know if you would like me to make any adjustments.

### After (User's style)
> J'ai fini l'implémentation pour RD-4450. Tous les tests passent, c'est ready pour review.
>
> J'ai modifié le data model comme demandé dans la spec. Y a pas de breaking changes.
>
> Ça devrait rouler pour le sprint de la semaine prochaine.
>
> Dis-moi ce que tu en penses @marie 🙏

**Preserved elements:**
- Bilingual: French base, English terms (tests, review, implementation, data model, spec, breaking changes, sprint)
- Casual-professional: "c'est ready", "ça devrait rouler"
- Structure: Context → technical details → timeline → sign-off
- Emoji: 🙏 for feedback request
- @mention and ticket reference (RD-4450)

---

## Example 4: Clarifying Technical Details

### Before (Generic AI style)
> Regarding your question about the API rate limiting, here is the explanation. We use a token bucket algorithm with a rate of 100 requests per minute. The implementation is in the rate_limiter.py file. You can find the configuration in the config.yaml file.

### After (User's style)
> Pour la question sur le rate limiting de l'API :
>
> On utilise un token bucket algorithm, avec un rate de 100 requests per minute. C'est dans `rate_limiter.py`.
>
> La config est dans `config.yaml`. Tu peux modifier le rate si besoin.
>
> Tu captes le principe ou tu veux que je détaille ? 😅

**Preserved elements:**
- Bilingual: French framing, English technical terms (rate limiting, API, token bucket algorithm, requests per minute, rate)
- Casual-professional: "tu captes le principe"
- Structure: Context → technical details → question → sign-off
- Specific file references
- Emoji: 😅 for offering clarification

---

## Example 5: Requesting a Feature Change

### Before (Generic AI style)
> I would like to propose a change to the feature. Instead of the current implementation, I suggest we use a different approach. This would improve performance and reduce complexity. I have created a draft PR #5678 showing the changes. What do you think?

### After (User's style)
> J'aurais une proposition pour le feature. Au lieu de l'approche actuelle, je pense qu'on pourrait faire différemment.
>
> Ça améliorerait la performance et ça réduirait la complexité. J'ai créé une draft PR #5678 pour montrer ce que j'ai en tête.
>
> Tu penses quoi de cette approche @pierre ? Je suis preneur de ton avis 🙏

**Preserved elements:**
- Bilingual: French base, English terms (feature, implementation, approach, performance, complexity, draft PR)
- Casual-professional: "j'aurais une proposition", "je pense qu'on pourrait", "ce que j'ai en tête"
- Structure: Context → technical explanation → PR reference → question → sign-off
- Emoji: 🙏 for feedback request
- @mention included

---

## Example 6: Sprint Planning Context

### Before (Generic AI style)
> I have reviewed the tickets for the upcoming sprint. Here is my assessment of the workload. I think we can complete tickets RD-4450, RD-4451, and RD-4452. However, RD-4453 might be too complex to finish in this sprint. We should prioritize accordingly.

### After (User's style)
> J'ai regardé les tickets pour le prochain sprint. Voilà ce que j'en pense :
>
> On peut largement faire RD-4450, RD-4451 et RD-4452. Par contre RD-4450 c'est un peu plus complexe.
>
> Faut qu'on priorise correctement. Je pense qu'on devrait commencer par RD-4450 et RD-4451.
>
> Ça devrait rouler si on se concentre là-dessus. Qu'est-ce que vous en dites ? 🙏

**Preserved elements:**
- Bilingual: French base, English terms (sprint, tickets, workload, prioritize)
- Casual-professional: "voilà ce que j'en pense", "ça devrait rouler", "qu'est-ce que vous en dites"
- Structure: Context → assessment → recommendation → question → sign-off
- Multiple ticket references (RD-4450, RD-4451, RD-4452, RD-4453)
- Emoji: 🙏 for team input

---

## Key Pattern Observations

### Technical Term Retention
In all examples, technical terms are kept in English:
- PR, sprint, tickets, repo, backend, API, deployment, endpoint, logs
- rate limiting, algorithm, performance, complexity, data model
- breaking changes, implementation, approach, config

### French Connector Patterns
Natural French connectors:
- "J'ai créé/fini/regardé" (I created/finished/looked at)
- "Je suis preneur" (I'm receptive to)
- "Je capte pas" (I don't get)
- "Ça devrait rouler" (It should go smoothly)
- "Dis-moi ce que tu en penses" (Tell me what you think)

### Emoji Placement
- 🙏: At the end when asking for something (help, feedback, review)
- 😅: After expressing uncertainty or confusion

### @mention Strategy
Always mention relevant people:
- After the main request/question
- Once per message, clear and direct
- No need to over-mention

### Technical Context
Always include specific references:
- PR numbers (#1234)
- Ticket IDs (RD-4450)
- File paths (rate_limiter.py)
- Endpoint paths (/api/auth)

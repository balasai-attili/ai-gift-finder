# GiftGenius AI — Model Training Data Guide

## Overview

This document explains the training dataset structure for the GiftGenius AI gift recommendation system and how to use it to improve the model's responses.

---

## File: `training_data.jsonl`

The training data is in **JSONL format** (one JSON object per line), where each line is a complete training example consisting of:

- A **user message** (the gift query with structured inputs)
- An **assistant message** (the ideal JSON response with 6 gift ideas)

This format is compatible with:
- **Anthropic Claude** fine-tuning (via API)
- **OpenAI GPT-4** fine-tuning
- **HuggingFace** datasets for custom model training

---

## Training Example Structure

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Recipient: [Relationship], [Age], [Gender]\nOccasion: [Occasion]\nInterests: [Interests]\nBudget: [Budget Range in INR]\nTone: [Gift Tone]"
    },
    {
      "role": "assistant",
      "content": "[{\"emoji\":\"🎁\",\"name\":\"Gift Name\",\"why\":\"One compelling sentence.\",\"price\":\"₹X–₹Y\",\"tags\":[\"Tag1\",\"Tag2\"]}]"
    }
  ]
}
```

---

## Input Fields

| Field        | Options |
|-------------|---------|
| Relationship | Partner/Spouse, Parent, Sibling, Best Friend, Child, Grandparent, Colleague, Boss, Teacher/Mentor, Neighbour |
| Age          | Under 10, 10–17, 18–25, 26–35, 36–50, 51–65, 65+ |
| Gender       | Male, Female, Non-binary (optional) |
| Occasion     | Birthday, Anniversary, Wedding, Christmas/Holiday, Graduation, Baby Shower, Housewarming, Valentine's Day, Diwali/Festive, Farewell, Thank You, Just Because, Raksha Bandhan, Teacher's Day, Pongal/Makar Sankranti, Eid |
| Budget       | Under ₹500, ₹500–₹1,500, ₹1,500–₹5,000, ₹5,000–₹15,000, ₹15,000+ |
| Tone         | funny and quirky, heartfelt and emotional, practical and useful, luxurious and premium, eco-friendly and sustainable, experiential and adventurous |

---

## Output Schema (per gift)

```json
{
  "emoji":  "string  — 1 relevant emoji",
  "name":   "string  — specific gift name (2–6 words), not generic",
  "why":    "string  — compelling reason (max 20 words)",
  "price":  "string  — realistic INR range e.g. '₹1,200–₹2,500'",
  "tags":   "array   — 2–3 tags from the allowed list below"
}
```

### Allowed Tags
`Personalized`, `Experiences`, `Tech`, `Books`, `Fashion`, `Wellness`, `Food`, `Home`, `Handmade`, `Luxury`, `Eco`, `Sports`, `Music`, `Art`, `Gaming`

---

## Current Dataset Stats

| Metric | Count |
|--------|-------|
| Total training examples | 15 |
| Occasions covered | 12 |
| Relationships covered | 10 |
| Budget tiers covered | 5 |
| Tones covered | 6 |
| Gift ideas total | 90 |

---

## How to Expand the Dataset

### Step 1: Add More Examples
Add new lines to `training_data.jsonl` following the exact format. Cover more combinations of:
- Unusual occasions (Eid, Pongal, Raksha Bandhan, Holi)
- Edge cases (65+ recipient, very young children, non-binary recipients)
- High-budget luxury scenarios
- Indian-specific interest combinations (classical music, cricket, astrology)

### Step 2: Quality Checklist for Each Example
Before adding a new example, verify:
- [ ] Gift name is specific (e.g., "Moleskine Cahier Notebook", not "a notebook")
- [ ] Price is realistic and within the stated budget range
- [ ] `why` field is ≤20 words and emotionally compelling
- [ ] All 3 tags are from the allowed list
- [ ] Exactly 6 gift objects in the array
- [ ] No markdown in the assistant response — pure JSON only

### Step 3: Balance Coverage
Aim for at least 3 examples per:
- Occasion
- Budget tier
- Tone type

---

## Using the Training Data

### Option A: In-Context Learning (Current Implementation)
The `SYSTEM_PROMPT` in `index.html` already includes the model's knowledge. The `training_data.jsonl` represents the expected output format — no additional fine-tuning required for the prototype.

### Option B: Claude Fine-Tuning via Anthropic API
```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

# Upload training file
with open("training_data.jsonl", "rb") as f:
    response = client.fine_tuning.jobs.create(
        model="claude-haiku-4",
        training_file=f,
        hyperparameters={"n_epochs": 3}
    )

print(response.fine_tuned_model)
```

### Option C: OpenAI GPT Fine-Tuning
```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key")

# Upload file
with open("training_data.jsonl", "rb") as f:
    file = client.files.create(file=f, purpose="fine-tune")

# Create fine-tuning job
job = client.fine_tuning.jobs.create(
    training_file=file.id,
    model="gpt-4o-mini"
)

print(job.id)
```

### Option D: Use as Few-Shot Examples
Inject 3–5 examples from the JSONL into the system prompt as demonstrations:
```javascript
const FEW_SHOT_EXAMPLES = `
Example 1:
User: Partner/Spouse, 26-35, Anniversary, yoga, ₹5,000–₹15,000
Assistant: [{"emoji":"🧘","name":"Personalized Yoga Mat",...}]

Example 2:
...
`;
```

---

## Sample New Training Entries to Add

Copy-paste these templates and fill in for more coverage:

```json
{"messages":[{"role":"user","content":"Recipient: [Relationship], [Age], [Gender]\nOccasion: [Occasion]\nInterests: [interests]\nBudget: [Budget]\nTone: [Tone]"},{"role":"assistant","content":"[YOUR 6 GIFT JSON ARRAY HERE]"}]}
```

### Recommended Next Additions
1. `Partner, 26-35, Male, Raksha Bandhan, gaming tech, ₹1,500–₹5,000, funny`
2. `Grandparent, 65+, Male, Birthday, cricket religion, ₹500–₹1,500, heartfelt`
3. `Child, 10-17, Female, Holi, art fashion, ₹500–₹1,500, experiential`
4. `Colleague, 36-50, Wedding, not specified, ₹5,000–₹15,000, luxurious`
5. `Best Friend, 26-35, Male, Just Because, fitness travel, ₹15,000+, luxury`

---

## Dataset Principles

1. **Specificity over generality** — "The 5AM Club by Robin Sharma" beats "a self-help book"
2. **Cultural relevance** — Include Indian brands, festivals, and traditions
3. **Budget discipline** — Never suggest gifts outside the stated range
4. **Emotional resonance** — The `why` field must explain the gift's personal meaning
5. **Tone consistency** — A "funny" tone suggestion should actually be funny/quirky

---

*GiftGenius AI — Training Data v1.0*
*Last updated: 2025*

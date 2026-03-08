# Synthetic Meltdown Log Generator

This module generates synthetic daily logs for training the Meltdown Pattern Predictor's machine learning model. Because real caregivers typically log only dozens of entries, we need larger datasets to train a useful predictor. The generator produces logs that match the app's schema while following patterns supported by autism and developmental research.

## Purpose

The generator serves two roles. First, it creates training data for the ML model when real user logs are few or absent. Second, it provides a documented, reproducible source of data whose structure and relationships are grounded in published findings. The coefficients and sampling rules are configurable in `config.py` so they can be tuned or updated as new research appears.

## Data Schema

Each log is a single day with seven input factors and one outcome:

| Field | Type | Description |
|-------|------|-------------|
| date | string | Date in YYYY-MM-DD format |
| sleepHours | number | Hours of sleep (4 to 12, 0.5 step) |
| noiseLevel | string | Low, Medium, or High sensory environment |
| sugarAfter6 | string | Yes or No: sugar intake after 6pm |
| screenAfter7 | string | Yes or No: screen exposure after 7pm |
| routineChange | string | Yes or No: routine was disrupted |
| mealAfter7 | string | Yes or No: meal after 7pm |
| meltdownOccurred | string | Yes or No: meltdown occurred that day |

This schema matches the Meltdown Pattern Predictor app exactly so generated logs can be loaded directly for testing or training.

## Factor Generation

### Sleep

Sleep is drawn from a truncated normal distribution centered at 7.5 hours with standard deviation 1.2, clipped between 4 and 12 hours. This approximates typical pediatric sleep patterns, with most nights near 7 to 8 hours and occasional short or long nights.

Research shows that sleep problems in autistic children explain 22% to 62% of variance in behavioral difficulties, depending on sleep severity. Sleep onset issues, night waking, and short duration correlate with hyperactivity, attention problems, anxiety, aggression, and emotional dysregulation. We treat sleep as the strongest predictor in the meltdown model.

**Sources:** Johnson et al.; Mazurek et al.; Sannar et al.; Yavuz-Kodat et al.; Sleep and Behaviour in Early Autism (Journal of Autism and Developmental Disorders); Sleep and Behavioral Problems in Children with ASD (Springer).

### Noise Level (Sensory Environment)

Noise level is sampled from a categorical distribution: 40% Low, 35% Medium, 25% High. This reflects a mix of calm days, moderate stimulation, and busier or noisier environments over many days.

Sensory differences are common in autism. Around 74% of autistic children have documented sensory features, and 60% to 71% report sensitivity to sound. Multiple studies find that sensory processing differences correlate with irritability and behavioral outbursts. Sleep problems also associate more strongly with irritability in children who have moderate to severe sensory sensitivities, suggesting an interaction between sensory load and other factors.

**Sources:** CDC sensory features study (large population surveillance); Dellapiazza et al.; Flowers et al.; Griffin et al.; Molcho-Haimovich et al.; Sleep disturbances and irritability in ASD children with sensory sensitivities (Journal of Neurodevelopmental Disorders, 2023).

### Binary Factors (Sugar, Screen, Routine, Meal)

Each binary factor is sampled from a Bernoulli distribution with a base probability. On "stress days" (high noise or low sleep), we add a fixed boost to each factor's probability so that stressful days are more likely to also have late sugar, late screens, routine changes, or late meals. This matches real-world correlation: busy or chaotic days tend to cluster multiple stressors.

Base probabilities are set to reflect plausible caregiver reports: routine change less common than late screens, late meal somewhat common, etc. The stress boost is configurable in `config.py`.

### Routine Change

Routine change is modeled as a strong predictor. Predictability helps many autistic people manage anxiety and reduce overload. When routines are disrupted, the amygdala can stay activated and stress responses (including meltdowns) increase. One study found that longer exposure to rigid routines led to more challenging behavior when those routines were changed, with more temper outbursts and higher heart rate when change occurred.

**Sources:** Increased Exposure to Rigid Routines can Lead to Increased Challenging Behavior Following Changes to Those Routines (Journal of Autism and Developmental Disorders, 2015); Simply Psychology summaries on autism and routine.

### Late Screen Exposure

Screen time before bedtime correlates with poorer sleep and more behavioral problems in autistic children. Sleep partially mediates the link between screen use and behavior, so we model screens as a moderate predictor that works partly through its effect on sleep.

**Sources:** The relationship between screen time before bedtime and behaviors of preschoolers with autism spectrum disorder (BMC Psychiatry, 2023, n=358).

### Late Sugar and Late Meal

Late sugar is linked to glycemic spikes and possible effects on mood and energy. Evidence is weaker than for sleep or sensory factors but suggests a moderate contribution. Late meals relate to GI discomfort and disruption of routine, and some studies link GI and mealtime problems to irritability. We model both as modest predictors.

**Sources:** Dietary glycemic index modulates behavioral and biochemical abnormalities associated with autism spectrum disorder (PubMed 26055422); Chaidez et al.; Ferguson et al.; Gastrointestinal Disorders and Food Selectivity (Children, MDPI).

## Meltdown Outcome Model

We use a logistic model: the probability of meltdown is the inverse logit of a linear combination of factor contributions plus noise.

```
P(meltdown) = 1 / (1 + exp(-z))
z = baseline + sleep_term + noise_term + routine_term + ... + noise
```

The baseline is chosen so the overall meltdown rate over many generated logs falls in a plausible range (roughly 25% to 40%), consistent with reports that irritability affects 19% to 80% of autistic children depending on sample and measure, and that crisis behaviors affect around 70%.

### Coefficients

Coefficients are research-informed estimates. No single paper provides odds ratios or regression coefficients for this exact set of predictors, so we set relative magnitudes from the literature:

- Sleep: Strongest effect. Per hour below 7, we add a negative contribution to z (increased risk). Sleep explains the largest share of behavioral variance in the studies we reviewed.
- Routine change: Strong effect. Routine disruption is a widely reported trigger.
- Noise (High): Strong effect. Sensory load consistently associates with irritability.
- Screen after 7: Moderate. Affects sleep and thus behavior.
- Sugar after 6: Moderate. Weaker evidence but plausible.
- Meal after 7: Moderate. Linked to GI and routine disruption.

### Interaction Term

We add an interaction for low sleep and high noise. Research suggests that sleep and sensory factors interact: the association between sleep problems and irritability is stronger in children with sensory sensitivities. The interaction term captures this.

### Noise

We add Gaussian noise to the log-odds to reflect unmeasured factors (mood, minor events, individual variation). This prevents the data from being perfectly deterministic and makes the generated distribution more realistic.

## Validation

After generating logs, you can:

1. Compute the overall meltdown rate. It should sit in a reasonable range (e.g., 25% to 45%).
2. Compare meltdown rates when each factor is present vs absent. High-risk combinations (e.g., low sleep, high noise, routine change) should show higher rates than low-risk combinations.
3. Load the JSON into the Meltdown Pattern Predictor app and run "Analyze Patterns." The app's descriptive statistics should reflect the same qualitative patterns (e.g., sleep below 7 hours associated with higher meltdown rate).

## Usage

From the `synthetic-data-generator` directory:

```bash
python generate.py --count 10000 --output synthetic_logs.json --seed 42
```

Options:

- `--count`: Number of logs (default: 10000)
- `--output`: Output file path (default: synthetic_logs.json)
- `--seed`: Random seed for reproducibility (default: 42)
- `--months`: Approximate date range in months (default: 12)

The output JSON is an array of log objects. It can be used for model training or imported into the app for testing.

## References

1. Chaidez V, Hansen RL, Hertz-Picciotto I. Gastrointestinal problems in children with autism, developmental delays or typical development. Journal of Autism and Developmental Disorders. 2014.

2. Dellapiazza F, Vernhet C, Blanc N, et al. Links between sleep and daytime behavior problems in children with autism spectrum disorder. Journal of Autism and Developmental Disorders. 2018;51.

3. Ferguson BJ, Marler S, Altstein LL, et al. Associations between cytokines, endocrine stress response, and gastrointestinal symptoms in autism spectrum disorder. Brain, Behavior, and Immunity. 2017.

4. Flowers E, Morris S, Kourti M. Sensory processing and its relationship to irritability in autism. Research in Autism Spectrum Disorders. 2021.

5. Griffin CE, Paterson KB, editors. Sleep disturbances are associated with irritability in ASD children with sensory sensitivities. Journal of Neurodevelopmental Disorders. 2023.

6. Johnson CR, DeMand A, Lecavalier L, et al. Sleep problems in children with autism spectrum disorder. Journal of Clinical Sleep Medicine. 2016.

7. Mazurek MO, Sohl K. Sleep and behavior in autism spectrum disorder. Pediatric Clinics of North America. 2020.

8. Molcho-Haimovich Y, Yarden Y, Ben-Zur M, et al. Sleep problems and sensory processing in toddlers with autism. Journal of Autism and Developmental Disorders. 2020.

9. Paul T, Carbone J, Kushki A, et al. Predictors of irritability in pediatric autistic populations: a scoping review. Frontiers in Child and Adolescent Psychiatry. 2024.

10. Sannar EM, Palka T, Beresford C, et al. Sleep problems and irritability in autism. Research in Autism Spectrum Disorders. 2018.

11. Sleep and Behaviour in Early Autism: Examining Bidirectional Associations Near Diagnosis. Journal of Autism and Developmental Disorders. Springer.

12. Sleep and Behavioral Problems in Children with Autism Spectrum Disorder. Journal of Autism and Developmental Disorders. Springer. 2016.

13. The relationship between screen time before bedtime and behaviors of preschoolers with autism spectrum disorder and the mediating effects of sleep. BMC Psychiatry. 2023.

14. Increased Exposure to Rigid Routines can Lead to Increased Challenging Behavior Following Changes to Those Routines. Journal of Autism and Developmental Disorders. Springer. 2015.

15. Yavuz-Kodat E, Geoffray MM, Limousin N, et al. Sleep and irritability in autism. Journal of Autism and Developmental Disorders. 2020.

16. CDC. Sensory features in autism: findings from a large population-based surveillance system. 2020.

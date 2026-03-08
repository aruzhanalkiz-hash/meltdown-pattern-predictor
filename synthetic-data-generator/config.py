"""
Configuration for the synthetic meltdown log generator.

All coefficients are research-informed estimates. See README.md for sources
and rationale. These values can be tuned for calibration or different
child profiles.
"""

# Generation parameters
NUM_LOGS = 10_000
DATE_RANGE_MONTHS = 12
SEED = 42  # For reproducibility

# Sleep distribution (hours). Normal around 7.5, std 1.2.
# Typical pediatric sleep for school-age children.
SLEEP_MEAN = 7.5
SLEEP_STD = 1.2
SLEEP_MIN = 4.0
SLEEP_MAX = 12.0

# Sleep threshold below which risk increases (hours).
# Below 7h consistently linked to behavioral problems in ASD research.
SLEEP_RISK_THRESHOLD = 7.0

# Noise level marginal distribution (must sum to 1.0).
# Reflects typical mix of environments over many days.
NOISE_DISTRIBUTION = {
    "Low": 0.40,
    "Medium": 0.35,
    "High": 0.25,
}

# Base probabilities for binary factors on "typical" days.
# Higher on weekends, or when other stressors present (see generator).
SUGAR_AFTER_6_BASE = 0.25
SCREEN_AFTER_7_BASE = 0.35
ROUTINE_CHANGE_BASE = 0.20
MEAL_AFTER_7_BASE = 0.25

# Stress day boost: when multiple factors suggest a busy/chaotic day,
# increase odds of other stressors (correlated factors).
STRESS_BOOST = 0.25

# Meltdown model: logistic P(meltdown) = 1 / (1 + exp(-z))
# z = BASELINE + sum of factor contributions
# Baseline tuned so overall meltdown rate is roughly 25-35%.
BASELINE = -1.65

# Factor contributions to log-odds. Positive = increases meltdown risk.
# Relative magnitudes follow research: sleep strongest, then routine,
# sensory, screens, sugar, late meal.
COEFFICIENTS = {
    # Per hour below SLEEP_RISK_THRESHOLD. Sleep explains 22-62% of
    # behavioral variance in ASD; treated as strongest predictor.
    # Positive = more deficit -> higher meltdown risk.
    "sleep_below_threshold": 0.30,
    # Sensory environment. High noise linked to irritability and
    # meltdowns; 60-74% of ASD children have sensory sensitivities.
    "noise_medium": 0.25,
    "noise_high": 0.75,
    # Routine change. Disruption of routines increases challenging
    # behavior; amygdala activation, predictability loss.
    "routine_change": 0.85,
    # Late screen exposure. Affects sleep, which mediates behavior.
    "screen_after_7": 0.45,
    # Late sugar. Glycemic swings, energy spikes; evidence weaker.
    "sugar_after_6": 0.35,
    # Late meal. GI discomfort, routine disruption; associated with
    # irritability in some studies.
    "meal_after_7": 0.30,
}

# Interaction: low sleep amplifies effect of high sensory load.
# Sleep and sensory interact in ASD (sensory moderates sleep-irritability).
INTERACTION_SLEEP_SENSORY = 0.20

# Random noise on log-odds. Real outcomes have unmeasured factors.
# 0.35 balances signal with realism (0.4 was noisier, 0.3 more predictable).
LOG_ODDS_NOISE_STD = 0.35

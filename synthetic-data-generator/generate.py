#!/usr/bin/env python3
"""
Synthetic meltdown log generator.

Produces JSON logs matching the Meltdown Pattern Predictor app schema.
Used to train ML models when real user data is limited.

Usage:
    python generate.py [--count N] [--output path] [--seed S]
"""

import argparse
import json
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

from config import (
    BASELINE,
    COEFFICIENTS,
    DATE_RANGE_MONTHS,
    INTERACTION_SLEEP_SENSORY,
    LOG_ODDS_NOISE_STD,
    MEAL_AFTER_7_BASE,
    NOISE_DISTRIBUTION,
    NUM_LOGS,
    ROUTINE_CHANGE_BASE,
    SCREEN_AFTER_7_BASE,
    SEED,
    SLEEP_MAX,
    SLEEP_MEAN,
    SLEEP_MIN,
    SLEEP_RISK_THRESHOLD,
    SLEEP_STD,
    STRESS_BOOST,
    SUGAR_AFTER_6_BASE,
)


def sample_sleep(rng: random.Random) -> float:
    """Sample sleep hours from truncated normal distribution."""
    hours = rng.gauss(SLEEP_MEAN, SLEEP_STD)
    return round(max(SLEEP_MIN, min(SLEEP_MAX, hours)) * 2) / 2  # 0.5 step


def sample_noise(rng: random.Random) -> str:
    """Sample noise level from categorical distribution."""
    r = rng.random()
    cumul = 0.0
    for level, prob in NOISE_DISTRIBUTION.items():
        cumul += prob
        if r <= cumul:
            return level
    return "Medium"


def sample_binary(rng: random.Random, base: float, stress_boost: float = 0.0) -> str:
    """Sample Yes/No with optional stress boost."""
    p = min(0.95, base + stress_boost)
    return "Yes" if rng.random() < p else "No"


def generate_factors(rng: random.Random, start_date: datetime) -> list[dict]:
    """
    Generate one log entry with correlated factors.

    Stressful days (high noise, routine change) boost probability of
    other stressors (late meal, late sugar, late screens) to reflect
    real-world correlation.
    """
    sleep = sample_sleep(rng)
    noise = sample_noise(rng)

    # Stress indicator: high noise or (low sleep) suggests harder day
    is_stress_day = noise == "High" or sleep < SLEEP_RISK_THRESHOLD
    boost = STRESS_BOOST if is_stress_day else 0.0

    sugar = sample_binary(rng, SUGAR_AFTER_6_BASE, boost)
    screen = sample_binary(rng, SCREEN_AFTER_7_BASE, boost)
    routine = sample_binary(rng, ROUTINE_CHANGE_BASE, boost)
    meal = sample_binary(rng, MEAL_AFTER_7_BASE, boost)

    return {
        "sleepHours": sleep,
        "noiseLevel": noise,
        "sugarAfter6": sugar,
        "screenAfter7": screen,
        "routineChange": routine,
        "mealAfter7": meal,
    }


def log_odds_meltdown(factors: dict, rng: random.Random) -> float:
    """
    Compute log-odds of meltdown given factors.

    Uses logistic-style additive model with interaction term.
    """
    z = BASELINE

    # Sleep: penalty per hour below threshold
    sleep = factors["sleepHours"]
    if sleep < SLEEP_RISK_THRESHOLD:
        deficit = SLEEP_RISK_THRESHOLD - sleep
        z += COEFFICIENTS["sleep_below_threshold"] * deficit

    # Noise
    noise = factors["noiseLevel"]
    if noise == "Medium":
        z += COEFFICIENTS["noise_medium"]
    elif noise == "High":
        z += COEFFICIENTS["noise_high"]

    # Binary factors
    if factors["routineChange"] == "Yes":
        z += COEFFICIENTS["routine_change"]
    if factors["screenAfter7"] == "Yes":
        z += COEFFICIENTS["screen_after_7"]
    if factors["sugarAfter6"] == "Yes":
        z += COEFFICIENTS["sugar_after_6"]
    if factors["mealAfter7"] == "Yes":
        z += COEFFICIENTS["meal_after_7"]

    # Interaction: low sleep + high noise
    if sleep < SLEEP_RISK_THRESHOLD and noise == "High":
        z += INTERACTION_SLEEP_SENSORY

    # Unexplained variation
    z += rng.gauss(0, LOG_ODDS_NOISE_STD)

    return z


def prob_from_log_odds(z: float) -> float:
    """Convert log-odds to probability."""
    return 1.0 / (1.0 + math.exp(-z))


def generate_logs(
    count: int,
    seed: int,
    months: int,
) -> List[dict]:
    """Generate count logs over approximately months of dates."""
    rng = random.Random(seed)
    start = datetime.now() - timedelta(days=months * 30)
    logs = []

    for i in range(count):
        # Spread dates over the range (some days may have multiple logs for variety)
        day_offset = (i * 97) % (months * 30)  # Quasi-random spread
        date = start + timedelta(days=day_offset)
        date_str = date.strftime("%Y-%m-%d")

        factors = generate_factors(rng, date)
        z = log_odds_meltdown(factors, rng)
        p = prob_from_log_odds(z)
        meltdown = "Yes" if rng.random() < p else "No"

        log = {
            "date": date_str,
            "sleepHours": factors["sleepHours"],
            "noiseLevel": factors["noiseLevel"],
            "sugarAfter6": factors["sugarAfter6"],
            "screenAfter7": factors["screenAfter7"],
            "routineChange": factors["routineChange"],
            "mealAfter7": factors["mealAfter7"],
            "meltdownOccurred": meltdown,
        }
        logs.append(log)

    return logs


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic meltdown logs for ML training."
    )
    parser.add_argument(
        "--count",
        type=int,
        default=NUM_LOGS,
        help=f"Number of logs to generate (default: {NUM_LOGS})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("synthetic_logs.json"),
        help="Output JSON file path",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=SEED,
        help=f"Random seed for reproducibility (default: {SEED})",
    )
    parser.add_argument(
        "--months",
        type=int,
        default=DATE_RANGE_MONTHS,
        help=f"Approximate date range in months (default: {DATE_RANGE_MONTHS})",
    )
    args = parser.parse_args()

    logs = generate_logs(args.count, args.seed, args.months)
    args.output.parent.mkdir(parents=True, exist_ok=True)

    with open(args.output, "w") as f:
        json.dump(logs, f, indent=2)

    meltdown_count = sum(1 for log in logs if log["meltdownOccurred"] == "Yes")
    rate = 100 * meltdown_count / len(logs)
    print(f"Generated {len(logs)} logs -> {args.output}")
    print(f"Meltdown rate: {meltdown_count}/{len(logs)} ({rate:.1f}%)")


if __name__ == "__main__":
    main()

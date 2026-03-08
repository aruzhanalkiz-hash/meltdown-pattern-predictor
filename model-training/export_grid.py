#!/usr/bin/env python3
"""
Export prediction grid for all input combinations.
Used by the frontend for client-side lookup (no API needed).
"""

import json
import pickle
import sys
from pathlib import Path

# Pickle references train._Preprocessor; add to __main__ so deserialization works
import train

sys.modules["__main__"]._Preprocessor = train._Preprocessor

MODEL_PATH = Path(__file__).parent / "model.pkl"
OUTPUT_PATH = Path(__file__).parent.parent / "predict_grid.json"

SLEEP_VALUES = [round(x * 0.5, 1) for x in range(8, 25)]  # 4.0 to 12.0
NOISE_VALUES = ["Low", "Medium", "High"]
BINARY_VALUES = ["Yes", "No"]


def main():
    with open(MODEL_PATH, "rb") as f:
        pipeline = pickle.load(f)

    grid = {}

    for sleep in SLEEP_VALUES:
        for noise in NOISE_VALUES:
            for sugar in BINARY_VALUES:
                for screen in BINARY_VALUES:
                    for routine in BINARY_VALUES:
                        for meal in BINARY_VALUES:
                            records = [{
                                "sleepHours": sleep,
                                "noiseLevel": noise,
                                "sugarAfter6": sugar,
                                "screenAfter7": screen,
                                "routineChange": routine,
                                "mealAfter7": meal,
                            }]
                            prob = float(pipeline.predict_proba(records)[0, 1])
                            pct = round(prob * 100)

                            if pct < 25:
                                tier = "Low"
                            elif pct < 50:
                                tier = "Medium"
                            else:
                                tier = "High"

                            key = f"{sleep}|{noise}|{sugar}|{screen}|{routine}|{meal}"
                            grid[key] = {"probability": pct, "tier": tier}

    with open(OUTPUT_PATH, "w") as f:
        json.dump(grid, f)

    print(f"Exported {len(grid)} predictions to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

# Meltdown Prediction Model Training

This folder trains a machine learning model to predict meltdown likelihood from daily factors. The model is trained on synthetic data produced by the `synthetic-data-generator` module.

## Model Choice: Logistic Regression

We use Logistic Regression because it won a fair benchmark (see `benchmark.py`).

**Benchmark results (5-fold CV on 20k synthetic logs):**

| Model | Accuracy | AUC-ROC | Brier |
|-------|----------|---------|-------|
| Logistic Regression | 64.0% | 0.676 | 0.225 |
| Random Forest | 63.5% | 0.659 | 0.228 |
| Random Forest (deeper) | 63.3% | 0.653 | 0.230 |

Logistic Regression has the best AUC and calibration. The pipeline adds `sleep_below_7` and `sleep_x_noise_high` to align with the generator's structure.

**Caveat:** On real caregiver data, the true relationship may be non-linear or include interactions we did not model. If you later get real logs and retrain, run `benchmark.py` again to compare models on that data. Logistic Regression may or may not remain best.

## Pipeline

The saved artifact is a sklearn Pipeline with two steps:

1. **Preprocessing.** Converts raw inputs into a numeric matrix: binary Yes/No to 0/1, noise one-hot encoded. Adds `sleep_below_7` and `sleep_x_noise_high` (interaction) to match the synthetic generator.

2. **StandardScaler.** Normalizes features for comparable coefficients.

3. **Logistic Regression.** Max iter 1000, C=2.0, class weight balanced.

The pipeline is saved with pickle so the inference API can load it and call `predict_proba` with the same input format.

## Benchmarking

Run `python benchmark.py` to compare models with 5-fold cross-validation. Uses the same data and reports accuracy, AUC-ROC, and Brier score. Install `xgboost` to include it in the comparison.

## Prerequisites

1. Generate synthetic data:

   ```bash
   cd ../synthetic-data-generator
   python generate.py --count 20000 --output synthetic_logs.json
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Usage

From the `model-training` directory:

```bash
python train.py
```

Or with explicit paths:

```bash
python train.py --data ../synthetic-data-generator/synthetic_logs.json --output model.pkl --metrics metrics.json
```

## Output

- **model.pkl** – Trained pipeline (preprocessor + classifier). Load with `pickle.load()`.
- **metrics.json** – Accuracy, AUC-ROC, classification report, confusion matrix, feature importance.

## Feature Order

The preprocessor expects inputs in this order for `predict_proba`:

- sleepHours (float)
- noiseLevel (Low, Medium, or High)
- sugarAfter6 (Yes or No)
- screenAfter7 (Yes or No)
- routineChange (Yes or No)
- mealAfter7 (Yes or No)

Output: probability of meltdown (0 to 1).

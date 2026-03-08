# Meltdown Prediction Model Training

This folder trains a machine learning model to predict meltdown likelihood from daily factors. The model is trained on synthetic data produced by the `synthetic-data-generator` module.

## Model Choice: XGBoost

We use XGBoost because it won the benchmark (see `benchmark.py`).

**Benchmark results (5-fold CV on 20k synthetic logs):**

| Model | Accuracy | AUC-ROC | Brier |
|-------|----------|---------|-------|
| **XGBoost** | **68.5%** | 0.665 | **0.207** |
| Logistic Regression | 63.8% | 0.676 | 0.226 |
| Random Forest | 63.3% | 0.657 | 0.229 |

XGBoost has the best accuracy and calibration (Brier). LogReg has slightly higher AUC (0.676 vs 0.665), but XGBoost improves accuracy by ~5 percentage points.

**Caveat:** On real caregiver data, run `benchmark.py` again to compare models.

## Pipeline

The saved artifact is a sklearn Pipeline with two steps:

1. **Preprocessing.** Converts raw inputs into a numeric matrix: binary Yes/No to 0/1, noise one-hot encoded. Adds `sleep_below_7` and `sleep_x_noise_high` (interaction) to match the synthetic generator.

2. **XGBoost.** 200 estimators, max depth 6, learning rate 0.1.

The pipeline is saved with pickle so the inference API can load it and call `predict_proba` with the same input format.

## Benchmarking

Run `python benchmark.py` to compare models with 5-fold cross-validation. Uses the same data and reports accuracy, AUC-ROC, and Brier score. XGBoost is included if installed; on Mac you may need `brew install libomp` first.

## Prerequisites

1. Generate synthetic data:

   ```bash
   cd ../synthetic-data-generator
   python3 generate.py --count 10000 --output synthetic_logs.json
   ```

2. Install dependencies:

   ```bash
   pip3 install -r requirements.txt
   ```

## Export Prediction Grid

After training, export a lookup grid for the frontend (no server needed):

```bash
python3 export_grid.py
```

This creates `predict_grid.json` in the project root. Each entry includes `probability`, `tier` (Low/Medium/High), and `contributors` (risk factors ranked by feature importance). Commit it so the deployed app can load it.

**Grid format:** Keys are `sleep|noise|sugar|screen|routine|meal` (e.g. `6.0|Medium|Yes|No|Yes|No`). Sleep values are 4.0 to 12.0 in 0.5 steps.

## Usage

From the `model-training` directory:

```bash
python3 train.py
```

Or with explicit paths:

```bash
python3 train.py --data ../synthetic-data-generator/synthetic_logs.json --output model.pkl --metrics metrics.json
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

# Meltdown Prediction Model Training

This folder trains a machine learning model to predict meltdown likelihood from daily factors. The model is trained on synthetic data produced by the `synthetic-data-generator` module.

## Model Choice: Random Forest

We use a Random Forest classifier rather than logistic regression, XGBoost, or a neural network.

**Why Random Forest:**

1. **Non-linear relationships.** The synthetic data generator includes interaction effects (e.g., low sleep amplifies the effect of high noise). Random forests capture these automatically without manual feature engineering. Logistic regression would require explicit interaction terms.

2. **Mixed feature types.** We have one numeric feature (sleep hours), one categorical (noise level), and four binary features. Trees handle mixed types naturally. No scaling or normalization is needed.

3. **Interpretability.** Feature importance scores show which factors matter most. This supports the "top contributors" explanation in the prediction UI. XGBoost also provides importance, but Random Forest is simpler to tune and explain.

4. **Robustness.** Random forests resist overfitting through bagging and feature subsampling. With 7 features and 10k samples, we avoid the risk of memorizing the training set. Neural networks would be unnecessary for this problem size.

5. **Calibrated probabilities.** We use `predict_proba` for the meltdown risk percentage. Tree ensembles produce reasonably calibrated probabilities for balanced or mildly imbalanced data. For heavily imbalanced data, we use `class_weight="balanced"` to offset any skew.

**Why not XGBoost?** XGBoost often yields slightly better accuracy on tabular data but requires more hyperparameter tuning. For our use case, Random Forest performs well with minimal tuning. We can switch later if needed.

**Why not logistic regression?** It would need hand-crafted interaction terms (e.g., sleep × noise) to match the data structure. The synthetic generator explicitly models these; Random Forest learns them from the data.

## Pipeline

The saved artifact is a sklearn Pipeline with two steps:

1. **Preprocessing.** Converts raw inputs (sleep hours, noise level, Yes/No fields) into a numeric matrix. Binary fields become 0/1. Noise level is one-hot encoded (Low, Medium, High).

2. **Random Forest.** 200 trees, max depth 10, min samples per leaf 5, class weight balanced.

The pipeline is saved with pickle so the inference API can load it and call `predict_proba` with the same input format.

## Prerequisites

1. Generate synthetic data:

   ```bash
   cd ../synthetic-data-generator
   python generate.py --count 10000 --output synthetic_logs.json
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

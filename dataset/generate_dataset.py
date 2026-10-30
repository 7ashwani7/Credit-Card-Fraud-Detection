"""
Realistic Credit Card Fraud Dataset Generator
Generates a representative credit card dataset structured identically to the
standard Kaggle creditcard.csv benchmark:
Columns: Time, V1..V28, Amount, Class
Normal: Class = 0 (~98.5%)
Fraud: Class = 1 (~1.5%)
"""

import csv
import math
import random
import os

def generate_creditcard_dataset(filepath: str, n_samples: int = 2500, fraud_ratio: float = 0.016, seed: int = 42):
    random.seed(seed)
    
    n_fraud = int(n_samples * fraud_ratio)
    n_normal = n_samples - n_fraud
    
    columns = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount", "Class"]
    
    rows = []
    
    # 1. Generate Normal Transactions
    for i in range(n_normal):
        # Time spaced out over 48 hours (172800 seconds)
        t = round(random.uniform(0, 172800), 1)
        
        # PCA components for normal transactions: standard normal variations
        v_features = [round(random.gauss(0, 1.0), 5) for _ in range(28)]
        
        # Amount: log-normal distribution with typical spending (mean ~$50-$90)
        # log-normal: exp(gauss(3.5, 1.1)) produces realistic amounts
        amount = round(min(random.expovariate(1/45) + random.uniform(2, 25), 3500.0), 2)
        if random.random() < 0.2:
            amount = round(random.uniform(5.0, 45.0), 2)
            
        rows.append([t] + v_features + [amount, 0])
        
    # 2. Generate Fraudulent Transactions with characteristic anomalies
    for i in range(n_fraud):
        t = round(random.uniform(1000, 170000), 1)
        
        # Fraud transactions display significant distribution shifts in key PCA features:
        # e.g., V14, V12, V10, V17 are significantly negative; V4, V11 are significantly positive
        v_features = []
        for feat_idx in range(1, 29):
            if feat_idx in [14, 12, 10, 17]:
                # Strong negative shift characteristic of fraud
                val = random.gauss(-4.8, 1.8)
            elif feat_idx in [4, 11, 2]:
                # Strong positive shift
                val = random.gauss(3.9, 1.5)
            elif feat_idx in [1, 3, 7, 8]:
                # Moderate shift
                val = random.gauss(-2.5, 1.7)
            else:
                # Other features may have higher variance
                val = random.gauss(0, 1.8)
            v_features.append(round(val, 5))
            
        # Fraud amounts: often either very small test transactions ($0.50-$2.00) or high spikes ($800-$2400)
        if random.random() < 0.4:
            amount = round(random.uniform(0.99, 4.99), 2)
        else:
            amount = round(random.uniform(450.0, 2490.0), 2)
            
        rows.append([t] + v_features + [amount, 1])
        
    # Shuffle transactions randomly so fraud is dispersed realistically
    random.shuffle(rows)
    
    # Sort slightly or keep realistic order
    rows.sort(key=lambda r: r[0])
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        writer.writerows(rows)
        
    print(f"Generated {len(rows)} transactions ({n_normal} Normal, {n_fraud} Fraud) -> {filepath}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(current_dir, "creditcard.csv")
    generate_creditcard_dataset(out_path, n_samples=2500, fraud_ratio=0.016)

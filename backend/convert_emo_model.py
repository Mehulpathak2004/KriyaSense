"""
One-time script to convert the GoEmotions TF model (tf_model.h5) 
to PyTorch format (model.safetensors) so transformers can load it natively.

Uses tensorflow + keras directly to load h5 weights, maps them to PyTorch state dict.
"""
import os
import sys
import json
import re
import numpy as np

EMO_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "emoModel")

print(f"emoModel directory: {EMO_MODEL_DIR}")
print(f"Files present: {os.listdir(EMO_MODEL_DIR)}")

import h5py
import torch
from transformers import RobertaForSequenceClassification, RobertaConfig

# Load config
config_path = os.path.join(EMO_MODEL_DIR, "config.json")
config = RobertaConfig.from_pretrained(EMO_MODEL_DIR)

# Create an empty PyTorch model with the right architecture
print("Creating empty PyTorch RobertaForSequenceClassification model...")
pt_model = RobertaForSequenceClassification(config)

# Load TF weights from h5
h5_path = os.path.join(EMO_MODEL_DIR, "tf_model.h5")
print(f"Loading TF weights from {h5_path}...")

def collect_h5_weights(h5_file):
    """Recursively collect all weight arrays from the h5 file."""
    weights = {}
    def visitor(name, obj):
        if isinstance(obj, h5py.Dataset):
            weights[name] = np.array(obj)
    h5_file.visititems(visitor)
    return weights

with h5py.File(h5_path, 'r') as f:
    tf_weights = collect_h5_weights(f)

print(f"Found {len(tf_weights)} TF weight tensors")

# Print TF weight names for debugging
for name in sorted(tf_weights.keys()):
    print(f"  TF: {name} shape={tf_weights[name].shape}")

# Build mapping from TF weight names to PyTorch state dict keys
pt_state_dict = pt_model.state_dict()
print(f"\nPyTorch model has {len(pt_state_dict)} parameters")
for name in sorted(pt_state_dict.keys()):
    print(f"  PT: {name} shape={tuple(pt_state_dict[name].shape)}")

# Now do the actual mapping
def map_tf_to_pt(tf_weights, pt_state_dict):
    """Map TF weight names to PyTorch state dict entries."""
    new_state_dict = {}
    
    for pt_name, pt_param in pt_state_dict.items():
        # Try to find matching TF weight
        # Common patterns:
        # PT: roberta.embeddings.word_embeddings.weight
        # TF: roberta/embeddings/word_embeddings/weight:0
        
        # Convert PT name to potential TF name patterns
        tf_name_parts = pt_name.replace("roberta.", "roberta/")
        tf_name_parts = tf_name_parts.replace("classifier.", "classifier/")
        tf_name_parts = tf_name_parts.replace(".", "/")
        
        # Look for matching TF key
        matched = False
        for tf_key, tf_val in tf_weights.items():
            # Normalize tf_key: strip off group prefixes and :0 suffixes
            tf_key_norm = tf_key.split("/")
            # Remove potential model name prefix
            # Typical TF keys: tf_roberta_for_sequence_classification/roberta/embeddings/...
            
            # Check if the important parts match
            tf_tail = "/".join(tf_key_norm)
            
            # Try exact normalized match
            search_key = tf_name_parts
            
            if search_key in tf_tail or tf_tail.endswith(search_key):
                # Check shape compatibility
                tf_shape = tf_val.shape
                pt_shape = tuple(pt_param.shape)
                
                if tf_shape == pt_shape:
                    new_state_dict[pt_name] = torch.from_numpy(tf_val)
                    matched = True
                    print(f"  MATCHED: {pt_name} <- {tf_key}")
                    break
                elif len(tf_shape) == 2 and tf_shape == pt_shape[::-1]:
                    # TF uses (in, out), PT uses (out, in) for linear layers
                    new_state_dict[pt_name] = torch.from_numpy(tf_val.T)
                    matched = True
                    print(f"  MATCHED (transposed): {pt_name} <- {tf_key}")
                    break
        
        if not matched:
            print(f"  UNMATCHED: {pt_name}")
    
    return new_state_dict

print("\n--- Mapping weights ---")
new_state_dict = map_tf_to_pt(tf_weights, pt_state_dict)

if len(new_state_dict) == len(pt_state_dict):
    print(f"\nAll {len(new_state_dict)} weights mapped successfully!")
else:
    print(f"\nMapped {len(new_state_dict)}/{len(pt_state_dict)} weights")
    missing = set(pt_state_dict.keys()) - set(new_state_dict.keys())
    print(f"Missing: {missing}")

# Load into model
pt_model.load_state_dict(new_state_dict, strict=False)

# Save
print(f"\nSaving PyTorch model to {EMO_MODEL_DIR}...")
pt_model.save_pretrained(EMO_MODEL_DIR)
print(f"Files now: {os.listdir(EMO_MODEL_DIR)}")
print("Done!")

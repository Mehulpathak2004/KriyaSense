import os
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import asyncio
# import whisper
# Setup paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SENTIMENT_MODEL_PATH = os.path.join(BASE_DIR, 'model')
EMOTION_MODEL_PATH = os.path.join(BASE_DIR, 'emoModel')

# Global references
sentiment_tokenizer = None
sentiment_model = None
emotion_tokenizer = None
emotion_model = None
whisper_model = None

def load_models():
    global sentiment_tokenizer, sentiment_model, emotion_tokenizer, emotion_model, whisper_model
    
    print("Loading sentiment model...")
    sentiment_tokenizer = AutoTokenizer.from_pretrained(SENTIMENT_MODEL_PATH)
    sentiment_model = AutoModelForSequenceClassification.from_pretrained(SENTIMENT_MODEL_PATH)
    sentiment_model.eval()
    
    print("Loading emotion model...")
    emotion_tokenizer = AutoTokenizer.from_pretrained(EMOTION_MODEL_PATH)
    emotion_model = AutoModelForSequenceClassification.from_pretrained(EMOTION_MODEL_PATH)
    emotion_model.eval()
    
    # print("Loading whisper model...")
    # whisper_model = whisper.load_model("base")
    
    print("Models loaded successfully.")

def predict_sentiment(text: str):
    inputs = sentiment_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = sentiment_model(**inputs)
        logits = outputs.logits
        
        # Apply temperature scaling T=1.037
        T = 1.037
        scaled_logits = logits / T
        probs = F.softmax(scaled_logits, dim=-1).squeeze().tolist()
        
    # Assuming labels are typically [Negative, Neutral, Positive] or check model config
    # We will map them based on standard RoBERTa sentiment if id2label is missing
    id2label = sentiment_model.config.id2label
    # Typically: 0 -> Negative, 1 -> Neutral, 2 -> Positive
    # If config doesn't have names, we assume this mapping:
    res = {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
    
    if len(id2label) == 3 and id2label[0] != "LABEL_0":
        for i, prob in enumerate(probs):
            label = id2label[i].lower()
            if "pos" in label: res["positive"] = round(prob * 100, 1)
            elif "neg" in label: res["negative"] = round(prob * 100, 1)
            else: res["neutral"] = round(prob * 100, 1)
    else:
        # Fallback to general mapping assuming 0: negative, 1: neutral, 2: positive
        res["negative"] = round(probs[0] * 100, 1)
        res["neutral"] = round(probs[1] * 100, 1)
        res["positive"] = round(probs[2] * 100, 1)
        
    return res

def predict_emotions(text: str):
    inputs = emotion_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = emotion_model(**inputs)
        logits = outputs.logits
        probs = torch.sigmoid(logits).squeeze().tolist()

    if not isinstance(probs, list):
        probs = [probs]

    id2label = emotion_model.config.id2label
    
    # Raise threshold to 0.5 — GoEmotions sigmoid scores need higher cutoff
    threshold = 0.5

    scored_emotions = []
    for i, prob in enumerate(probs):
        if prob > threshold:
            label = id2label.get(i, f"label_{i}")
            scored_emotions.append((label, prob))

    # Sort by confidence descending, return top 5 max
    scored_emotions.sort(key=lambda x: x[1], reverse=True)
    present_emotions = [label for label, _ in scored_emotions[:5]]

    # If nothing passes threshold, return the single top emotion
    if not present_emotions:
        top_idx = int(torch.sigmoid(outputs.logits).squeeze().argmax().item())
        present_emotions = [id2label.get(top_idx, "neutral")]

    return present_emotions

async def run_inference(text: str):
    # Run in parallel using asyncio.gather with run_in_executor to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    
    sentiment_task = loop.run_in_executor(None, predict_sentiment, text)
    emotion_task = loop.run_in_executor(None, predict_emotions, text)
    
    sentiment, emotions = await asyncio.gather(sentiment_task, emotion_task)
    
    # Calculate dominant sentiment
    dominant_sentiment = max(sentiment, key=sentiment.get)
    
    return {
        "sentiment": sentiment,
        "emotions": emotions,
        "dominant_sentiment": dominant_sentiment
    }

# async def transcribe_audio(file_path: str) -> str:
#     loop = asyncio.get_event_loop()
#     # run in executor since whisper is synchronous
#     result = await loop.run_in_executor(None, whisper_model.transcribe, file_path)
#     return result["text"]

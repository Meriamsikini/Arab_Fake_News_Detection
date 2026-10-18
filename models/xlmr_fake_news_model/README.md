---
language:
  - ar
base_model: FacebookAI/xlm-roberta-base
pipeline_tag: text-classification
tags:
  - arabic
  - fake-news
  - text-classification
  - transformers
  - pytorch
---

# XLM-RoBERTa Arabic Fake News Classifier

Fine-tuned XLM-RoBERTa model for binary classification of Arabic news articles as `real` or `fake`.

## Model details

- Base model: `FacebookAI/xlm-roberta-base`
- Architecture: `XLMRobertaForSequenceClassification`
- Language: Arabic
- Labels: `0 = real`, `1 = fake`
- Maximum input length: 256 tokens; longer inputs are truncated
- Tokenizer: XLM-RoBERTa tokenizer included with this model
- Training framework: PyTorch and Hugging Face Transformers

## Training data

The training metadata describes a balanced corpus of 20,000 Arabic articles: 10,000 real and 10,000 fake. The split was stratified into 15,999 training, 2,001 validation, and 2,000 test examples. The datasets are not included in this model directory.

Training configuration recorded in the metadata includes a learning rate of `2e-5`, weight decay of `0.01`, effective batch size of 32, a maximum of 4 epochs, and early stopping with patience 2.

## Evaluation

Reported test metrics for the positive class `fake`:

| Metric | Score |
| --- | ---: |
| Accuracy | 0.8530 |
| Precision | 0.8091 |
| Recall | 0.9240 |
| F1 | 0.8627 |
| ROC AUC | 0.9417 |

The test set contains 2,000 examples (1,000 per class). The metadata says the decision-threshold search was performed on the test split. Consequently, the reported best threshold and F1 are not an unbiased final estimate; evaluate a threshold selected on validation data against a separate held-out test set before making comparative or deployment claims.

## Usage

```python
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

model_dir = "./xlmr_fake_news_model"
tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForSequenceClassification.from_pretrained(model_dir)
model.eval()

text = "ضع هنا نص الخبر العربي"
inputs = tokenizer(
    text,
    max_length=256,
    truncation=True,
    return_tensors="pt",
)

with torch.inference_mode():
    probabilities = torch.softmax(model(**inputs).logits, dim=-1)[0]

labels = model.config.id2label
prediction = labels[int(probabilities.argmax())]
print(prediction, probabilities.tolist())
```

## Intended use and limitations

This model is an experimental text classifier for research and decision support. It estimates patterns associated with the labels in its training data; it does not verify claims, establish truth, or replace source checking and professional fact-checking. Performance may vary across publishers, topics, dialects, time periods, and writing styles. Do not use its predictions as the sole basis for consequential decisions.

## Files

This directory contains the model configuration, tokenizer files, metadata, and `model.safetensors` weights.

## License

No license information was present in the supplied model metadata. Confirm the rights to the fine-tuned weights, base model, and training data before redistributing them.

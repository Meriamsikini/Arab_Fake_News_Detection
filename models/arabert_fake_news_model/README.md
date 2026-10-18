---
language:
  - ar
base_model: aubmindlab/bert-base-arabertv02
pipeline_tag: text-classification
tags:
  - arabic
  - fake-news
  - text-classification
  - transformers
  - pytorch
---

# AraBERT Arabic Fake News Classifier

Fine-tuned AraBERT model for binary classification of Arabic news articles as `real` or `fake`. Inputs are preprocessed with the AraBERT preprocessor before tokenization.

## Model details

- Base model: `aubmindlab/bert-base-arabertv02`
- Architecture: `BertForSequenceClassification`
- Language: Arabic
- Labels: `0 = real`, `1 = fake`
- Maximum input length: 256 tokens; longer inputs are truncated
- Tokenizer: AraBERT tokenizer included with this model
- Preprocessor: `aubmindlab/bert-base-arabertv02`
- Decision threshold for `fake`: 0.45
- Training framework: PyTorch and Hugging Face Transformers

## Evaluation

The supplied metadata reports the following test metrics at threshold `0.50` (positive class: `fake`):

| Metric | Score |
| --- | ---: |
| Accuracy | 0.8800 |
| Precision | 0.8770 |
| Recall | 0.8840 |
| F1 | 0.8805 |
| ROC AUC | 0.9602 |

The confusion matrix corresponds to 2,000 examples, with 1,000 examples per class. The metadata also reports threshold-optimization metrics at threshold `0.45`: precision `0.8721`, recall `0.9000`, and F1 `0.8858`. It does not identify the split used for this threshold optimization. Select a threshold on validation data and evaluate it on a separate held-out test set before making deployment or comparative claims.

## Usage

```python
import torch
from arabert import ArabertPreprocessor
from transformers import AutoModelForSequenceClassification, AutoTokenizer

model_dir = "./arabert_fake_news_model"
preprocessor = ArabertPreprocessor(model_name="aubmindlab/bert-base-arabertv02")
tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForSequenceClassification.from_pretrained(model_dir)
model.eval()

text = "ضع هنا نص الخبر العربي"
prepared_text = preprocessor.preprocess(text)
inputs = tokenizer(
    prepared_text,
    max_length=256,
    truncation=True,
    return_tensors="pt",
)

with torch.inference_mode():
    probabilities = torch.softmax(model(**inputs).logits, dim=-1)[0]

labels = model.config.id2label
prediction = labels[1] if probabilities[1].item() >= 0.45 else labels[0]
print(prediction, probabilities.tolist())
```

Install the `arabert`, `transformers`, and `torch` packages before running the example.

## Intended use and limitations

This model is an experimental text classifier for research and decision support. It estimates patterns associated with the labels in its training data; it does not verify claims, establish truth, or replace source checking and professional fact-checking. Performance may vary across publishers, topics, dialects, time periods, and writing styles. Do not use its predictions as the sole basis for consequential decisions.

The supplied metadata does not describe the dataset composition, split protocol, or training hyperparameters. These should be documented before treating the reported scores as independently reproducible.

## Files

This directory contains the model configuration, tokenizer files, inference settings, label mapping, metadata, and `model.safetensors` weights.

## License

No license information was present in the supplied model metadata. Confirm the rights to the fine-tuned weights, base model, and training data before redistributing them.

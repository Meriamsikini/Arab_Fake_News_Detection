# Arabic Fake News Detection with AraBERT and XLM-RoBERTa

An end-to-end Arabic fake news detection project combining data preparation, Transformer fine-tuning, a FastAPI inference backend, and a Next.js web interface. The application supports predictions with two fine-tuned models, displays evaluation metrics, and maintains a local history of analyses.

## Overview

This project explores binary classification of Arabic news articles using two pretrained Transformer architectures fine-tuned for the task:

- **AraBERT** — a Transformer model specifically developed for Arabic NLP.
- **XLM-RoBERTa** — a multilingual Transformer model supporting Arabic and other languages.

The project covers the main stages of an NLP application: dataset cleaning and preparation, model fine-tuning, evaluation, API development, and frontend integration.

**Important:** The predictions indicate how closely a text matches patterns learned from the training data. They do not independently verify whether a news article is factually true.

## Key Features

- Arabic news data cleaning, merging, deduplication, and dataset reduction.
- Fine-tuning of AraBERT and XLM-RoBERTa for binary text classification.
- Individual inference with either model or side-by-side predictions with both models.
- Prediction probabilities, confidence scores, inference time, and token-length information.
- Evaluation metrics, including accuracy, precision, recall, F1-score, and ROC-AUC where available.
- Dashboard with prediction statistics and recent analyses.
- Analysis history with individual and bulk deletion.
- FastAPI backend connected to a Next.js and TypeScript frontend.
- SQLite storage for analysis history.

## Project Architecture

The application is organized into four main stages:

1. **Data preparation:** clean, merge, deduplicate, and reduce the Arabic news datasets.
2. **Model development:** fine-tune AraBERT and XLM-RoBERTa using the training notebooks.
3. **Inference API:** load the trained models and expose prediction and evaluation endpoints through FastAPI.
4. **Web application:** provide an interface for running predictions, comparing models, reviewing metrics, and managing analysis history.

## Dataset

The project uses the **Arabic Fake News Dataset (AFND)** as its dataset source.

- Dataset: [Arabic Fake News Dataset — Mendeley Data](https://data.mendeley.com/datasets/67mhx6hhzd/1)
- Data preparation includes text cleaning, deduplication, article filtering, dataset merging, and reduction of the real-news dataset.
- The XLM-RoBERTa model metadata records a balanced training corpus of **20,000 articles: 10,000 real and 10,000 fake**.

The 20,000-article figure describes the corpus recorded in the XLM-RoBERTa model metadata, not the total size of the original AFND dataset.

The dataset files are not included in the repository. Obtain the data from its source and prepare the required files before rerunning the data-processing pipeline or training notebooks.

## Models

### 1. AraBERT

- Base model: [`aubmindlab/bert-base-arabertv02`](https://huggingface.co/aubmindlab/bert-base-arabertv02)
- Fine-tuned model: [Merry2321/arab_fake_news_arabert](https://huggingface.co/Merry2321/arab_fake_news_arabert)
- Task: binary Arabic news classification.
- Labels: `real` and `fake`.
- Maximum input length: 256 tokens.
- Arabic-specific preprocessing is applied before tokenization.
- The configured inference decision threshold is approximately `0.45`.

### 2. XLM-RoBERTa

- Base model: [`FacebookAI/xlm-roberta-base`](https://huggingface.co/FacebookAI/xlm-roberta-base)
- Fine-tuned model: **[Add the XLM-RoBERTa Hugging Face model link here]**
- Task: binary Arabic news classification.
- Labels: `real` and `fake`.
- Maximum input length: 256 tokens.
- Training framework: PyTorch and Hugging Face Transformers.
- The configured inference decision threshold is `0.50`.

### Reported evaluation results

The following scores are taken from the model metadata committed to this repository.

| Metric | AraBERT | XLM-RoBERTa |
|---|---:|---:|
| Accuracy | 88.00% | 85.30% |
| Precision (fake class) | 87.70% | 80.91% |
| Recall (fake class) | 88.40% | 92.40% |
| F1-score | 88.05% | 86.27% |
| ROC-AUC | 96.02% | 94.17% |

**Evaluation note:** These scores should not be interpreted as a definitive head-to-head comparison. The XLM-RoBERTa metadata indicates that the decision threshold was searched on the test set, which can make the reported test performance optimistic. A rigorous comparison should select thresholds using validation data and evaluate both models on the same untouched test set.

## Repository Structure

```text
Arab_Fake_News_Detection/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── main.py
│   │   ├── model_service.py
│   │   └── schemas.py
│   ├── data/
│   └── requirements.txt
├── cleaning/
│   ├── clean_dataset.py
│   ├── merge_dataset.py
│   ├── semantic_reduction_real_news_30k_to_10k.ipynb
│   └── to_30K_.py
├── fine-tuning/
│   ├── fake_news_arabic_finetuning_arabert.ipynb
│   └── fake_news_arabic_finetuning_xlmr.ipynb
├── frontend/
│   ├── app/
│   │   ├── analyzer/
│   │   ├── evaluation/
│   │   ├── history/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   ├── next.config.mjs
│   ├── package.json
│   └── .env.local.example
├── models/
│   ├── arabert_fake_news_model/
│   └── xlmr_fake_news_model/
├── scripts/
│   └── add_metrics_to_config.py
└── .gitignore
```

The repository contains the model configurations, metadata, tokenizer-related files, and inference settings. Large model weight files are excluded from Git.

## Technology Stack

| Component | Technologies |
|---|---|
| Programming language | Python, TypeScript |
| Data preparation | Python, JSON, pandas-style data processing |
| NLP and deep learning | PyTorch, Hugging Face Transformers |
| Arabic NLP | AraBERT preprocessing |
| Model architectures | AraBERT, XLM-RoBERTa |
| Backend | FastAPI, Pydantic, Uvicorn |
| Frontend | Next.js, React |
| Database | SQLite |
| Model evaluation | Accuracy, precision, recall, F1-score, ROC-AUC |

## Installation and Setup

### Prerequisites

Install Python, Node.js, and npm. Model loading also requires sufficient RAM and storage for the Transformer weights.

### 1. Clone the repository

```bash
git clone https://github.com/Meriamsikini/Arab_Fake_News_Detection.git
cd Arab_Fake_News_Detection
```

### 2. Download the fine-tuned model weights

The repository excludes `model.safetensors` from version control. Download the model files from the Hugging Face repositories and place them in the corresponding local directories:

- AraBERT: `models/arabert_fake_news_model/`
- XLM-RoBERTa: `models/xlmr_fake_news_model/`

Each model directory must contain its required model weights and configuration files. The backend checks for `config.json` and `model.safetensors` when loading a model.

AraBERT model: [Merry2321/arab_fake_news_arabert](https://huggingface.co/Merry2321/arab_fake_news_arabert)

XLM-RoBERTa model: add the fine-tuned Hugging Face link when available.

### 3. Set up the backend

From the repository root, run:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start the API from the `backend` directory:

```bash
uvicorn app.main:app --reload
```

The API should be available at `http://127.0.0.1:8000`.

Interactive API documentation: `http://127.0.0.1:8000/docs`

Health endpoint: `http://127.0.0.1:8000/api/health`

The health endpoint reports model loading status and helps diagnose missing files or other loading errors.

### 4. Set up the frontend

Open another terminal at the repository root:

```bash
cd frontend
npm install
```

Create a local environment file from the provided example:

```powershell
Copy-Item .env.local.example .env.local
```

The example configures `BACKEND_URL=http://127.0.0.1:8000`. Update it if the backend uses a different address.

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

The Next.js configuration forwards browser requests under `/api/` to the FastAPI backend.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | API information |
| `GET` | `/api/health` | Backend and model health |
| `POST` | `/api/predict` | Classify Arabic news text |
| `GET` | `/api/metrics` | Retrieve model evaluation metrics |
| `GET` | `/api/stats` | Retrieve prediction statistics |
| `GET` | `/api/history` | List saved analyses |
| `GET` | `/api/history/{pid}` | Retrieve an individual analysis |
| `DELETE` | `/api/history/{pid}` | Delete an individual analysis |
| `DELETE` | `/api/history` | Clear the analysis history |

### Example prediction request

Send a `POST` request to `/api/predict` with a JSON body:

```json
{
  "text": "ضع نص الخبر العربي هنا",
  "model": "both",
  "save": true,
  "store_full_text": false
}
```

The `model` field accepts `xlmr`, `arabert`, or `both`. By default, the API stores an excerpt of the submitted text in the history. Setting `store_full_text` to `true` explicitly requests storage of the full text.

## Data Preparation and Training

The data-processing scripts are located in `cleaning/`:

- `clean_dataset.py` — cleans article records and prepares labeled datasets.
- `merge_dataset.py` — merges cleaned JSON files and removes duplicate articles.
- `to_30K_.py` — filters and reduces the real-news dataset using date, article-length, and category-based sampling criteria.
- `semantic_reduction_real_news_30k_to_10k.ipynb` — notebook for semantic reduction of the real-news dataset.

The model fine-tuning notebooks are located in `fine-tuning/`:

- `fake_news_arabic_finetuning_arabert.ipynb`
- `fake_news_arabic_finetuning_xlmr.ipynb`

The notebooks document the training workflows. Reproducing training requires the source datasets, the relevant dependencies, and suitable computational resources.

## Limitations

- Model predictions are probabilistic classifications, not independent fact verification.
- Performance can vary across publishers, subjects, dialects, writing styles, and time periods.
- Articles longer than the configured maximum token length are truncated during inference.
- Evaluation scores depend on dataset quality, class distribution, and the train/validation/test split.
- The current history database uses SQLite and is intended for a local application setup.
- A deployment intended for real-world use should include further evaluation, monitoring, security controls, and careful handling of submitted news text.

## Future Improvements

- Complete a controlled comparison of AraBERT and XLM-RoBERTa on an untouched shared test set.
- Evaluate generalization across different Arabic news sources and topics.
- Improve reproducibility through documented data versions, training configurations, and evaluation procedures.
- Deploy the API and frontend with production-ready security and monitoring.
- Add further model interpretability and error-analysis capabilities.

## Author

**Meriam Sikini**

GitHub: [@Meriamsikini](https://github.com/Meriamsikini)

## Acknowledgements

This project builds on the Arabic Fake News Dataset (AFND), the AraBERT model, and the XLM-RoBERTa model. Please consult the original dataset and base-model documentation for their respective terms of use and licensing information.

## Disclaimer

This project is intended for educational and research purposes. Its outputs should not be treated as definitive judgments of truth or used as the sole basis for consequential decisions.

import os
from pathlib import Path

import nltk
from nltk import data as nltk_data
from nltk.sentiment import SentimentIntensityAnalyzer


def _add_local_nltk_path():
    """
    Ensure nltk looks inside the repo-level nltk_data directory before touching the network.
    """
    project_root = Path(__file__).resolve().parents[4]
    local_data_dir = project_root / "nltk_data"
    if local_data_dir.exists():
        local_path_str = str(local_data_dir)
        if local_path_str not in nltk.data.path:
            nltk.data.path.insert(0, local_path_str)


def _ensure_vader_downloaded():
    """
    Attempt to load the VADER lexicon. If it is not available locally, try downloading it.
    Raises a RuntimeError with a clear message if all attempts fail.
    """
    resource_id = "sentiment/vader_lexicon.zip/vader_lexicon/vader_lexicon.txt"
    try:
        nltk_data.find(resource_id)
        return
    except LookupError:
        pass

    local_dir = Path(nltk.data.path[0]) if nltk.data.path else Path(os.getcwd())
    try:
        nltk.download("vader_lexicon", download_dir=str(local_dir), quiet=True)
        nltk_data.find(resource_id)
    except Exception as download_error:  # pylint: disable=broad-except
        raise RuntimeError(
            "Unable to load the VADER lexicon required for chatbot sentiment analysis. "
            "Please ensure nltk_data is present or network access is available."
        ) from download_error


_add_local_nltk_path()
_ensure_vader_downloaded()
sentiAnalysis = SentimentIntensityAnalyzer()


def sentiment_api(sentence):
    senti_score = get_score(sentence)
    return senti_score


def get_score(sentence):
    senti_score = sentiAnalysis.polarity_scores(sentence)
    return senti_score
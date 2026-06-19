import json
from difflib import SequenceMatcher
from pathlib import Path

from flask import Blueprint, request, jsonify

chatbot_bp = Blueprint('chatbot', __name__)

DATASET_PATH = Path(__file__).with_name('chat_bot_dataset.json')
SIMILARITY_THRESHOLD = 0.55

INTENT_RESPONSES = [
    {
        "keywords": ["hi", "hello", "hey", "good morning", "good evening"],
        "response": (
            "Hey there! 👋 I'm the ScalpSense assistant. "
            "Ask me anything about self-tests, products, or connecting with our doctors."
        )
    },
    {
        "keywords": ["thank", "thanks", "appreciate"],
        "response": (
            "Happy to help! If you need anything else about ScalpSense services or products, just let me know."
        )
    },
    {
        "keywords": ["bye", "goodbye", "see you", "take care"],
        "response": (
            "Goodbye! 👋 Remember you can revisit the self-test anytime or email joy628545@gmail.com for personal assistance."
        )
    },
    {
        "keywords": ["contact", "email", "support"],
        "response": (
            "You can reach the ScalpSense team at joy628545@gmail.com or through the Contact section of the website."
        )
    },
    {
        "keywords": ["price", "cost", "payment"],
        "response": (
            "Product prices are listed in the Marketplace tab. After selecting items, use the cart checkout summary for final totals."
        )
    },
    {
        "keywords": ["delivery", "shipping"],
        "response": (
            "We ship pan-India and internationally. Delivery timelines are shown at checkout once you add your address."
        )
    }
]


def _load_qa_pairs():
    if not DATASET_PATH.exists():
        return []
    with open(DATASET_PATH, 'r', encoding='utf-8') as dataset_file:
        dataset = json.load(dataset_file)
    history = dataset.get('payload', {}).get('conversation_history', [])
    qa_pairs = []
    for pair in history:
        if not isinstance(pair, dict):
            continue
        for question, answer in pair.items():
            qa_pairs.append({
                'question': question,
                'answer': answer,
                'normalized_question': question.lower()
            })
    return qa_pairs


QA_PAIRS = _load_qa_pairs()
FALLBACK_RESPONSE = (
    "I’m here to help with anything related to ScalpSense. "
    "Could you please rephrase your question? "
    "You can also email joy628545@gmail.com for detailed assistance."
)


def _get_best_answer(prompt: str) -> str:
    if not prompt:
        return FALLBACK_RESPONSE

    prompt_lower = prompt.lower()

    # Quick intent-based responses
    for intent in INTENT_RESPONSES:
        if any(keyword in prompt_lower for keyword in intent["keywords"]):
            return intent["response"]

    best_match = None
    best_score = 0

    for pair in QA_PAIRS:
        score = SequenceMatcher(None, prompt_lower, pair['normalized_question']).ratio()
        if score > best_score:
            best_score = score
            best_match = pair

    if best_match and best_score >= SIMILARITY_THRESHOLD:
        return best_match['answer']

    # keyword-based hints for common intents
    if 'doctor' in prompt_lower or 'consult' in prompt_lower:
        return ("You can connect with our verified doctors directly from the chat page "
                "or email joy628545@gmail.com with your details for a callback.")

    if 'product' in prompt_lower or 'recommend' in prompt_lower:
        return ("Visit the Marketplace tab to explore remedies curated for every scalp stage. "
                "Your self-test results also include a Recommended Products button for quick access.")

    return FALLBACK_RESPONSE


def botResponse(prompt):
    clean_prompt = (prompt or '').strip()
    return _get_best_answer(clean_prompt)

@chatbot_bp.route('/prompt', methods=['POST'])
def chatbot():
    prompt = request.json['prompt']

    response = botResponse(prompt)

    return jsonify({'response': response})
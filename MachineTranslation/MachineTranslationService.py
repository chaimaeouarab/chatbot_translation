# Transformers Imports
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# PyTorch Imports
import torch

# OS Imports
import os

# Flask Imports
from flask import Flask, request, jsonify

# Language Detection Imports
from langdetect import detect, DetectorFactory, LangDetectException

DetectorFactory.seed = 0   # même résultat à chaque détection

app = Flask(__name__)
app.json.ensure_ascii = False   # garder l'arabe lisible dans le JSON

# Current Directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Absolute Path to the model
model_path = os.path.join(current_dir, "nllb-600M")

# Model Loading
print("Loading model and tokenizer from local disk...")

tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
model = AutoModelForSeq2SeqLM.from_pretrained(
    model_path,
    local_files_only=True,
    dtype=torch.float32
)
model.eval()

print("Model loaded successfully.")


##############################################
# Translation Function
##############################################
def translate(text, src_lang="fra_Latn", tgt_lang="eng_Latn"):
    tokenizer.src_lang = src_lang
    inputs = tokenizer(text, return_tensors="pt").to(model.device)

    forced_bos_token_id = tokenizer.convert_tokens_to_ids(tgt_lang)

    with torch.no_grad():
        translated_tokens = model.generate(
            **inputs,
            forced_bos_token_id=forced_bos_token_id,
            max_length=512
        )

    return tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]


##############################################
# Source Language Auto-Detection
##############################################
# code langdetect -> code NLLB
LANG_MAP = {
    "fr": "fra_Latn",
    "en": "eng_Latn",
    "ar": "arb_Arab",
    "es": "spa_Latn",
    "de": "deu_Latn",
    "it": "ita_Latn",
    "pt": "por_Latn",
    "tr": "tur_Latn",
}

# mots typiques de la darija (pour la distinguer de l'arabe classique)
DARIJA_WORDS = {
    "بغيت", "ديال", "ديالي", "ديالك", "واش", "شنو", "علاش", "كيفاش", "فين",
    "بزاف", "دابا", "خاصني", "خاصك", "مزيان", "غادي", "ماشي", "هادشي",
    "شحال", "كاين", "والو", "كنبغي", "بغينا", "عافاك",
}


def detect_language(text):
    try:
        code = detect(text)
    except LangDetectException:
        return "fra_Latn"   # texte trop court ou vide

    # langdetect ne connaît pas la darija : on la reconnaît par ses mots typiques
    if code == "ar":
        words = [w.strip("؟?.,!،") for w in text.split()]
        if any(w in DARIJA_WORDS for w in words):
            return "ary_Arab"
        return "arb_Arab"

    return LANG_MAP.get(code, "eng_Latn")


##############################################
# Translation Endpoint (v1) : langue source donnée
##############################################
@app.post("/translate")
def translate_endpoint():
    data = request.get_json(silent=True) or {}
    print(data)

    text = data.get("text", "")
    src_lang = data.get("src_lang", "fra_Latn")
    tgt_lang = data.get("tgt_lang", "eng_Latn")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    translated = translate(text, src_lang, tgt_lang)
    return jsonify({"text": text, "translation": translated}), 200


##############################################
# Language Detection Endpoint
##############################################
@app.post("/detect")
def detect_endpoint():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    return jsonify({"text": text, "language": detect_language(text)}), 200


##############################################
# Translation Endpoint with Auto-Detection (v2)
##############################################
@app.post("/translate/v2")
def translate_v2_endpoint():
    data = request.get_json(silent=True) or {}
    print(data)

    text = data.get("text", "")
    tgt_lang = data.get("tgt_lang", "eng_Latn")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    src_lang = detect_language(text)

    # même langue : rien à traduire
    if src_lang == tgt_lang:
        translated = text
    else:
        translated = translate(text, src_lang, tgt_lang)

    return jsonify({
        "text": text,
        "detected_lang": src_lang,
        "tgt_lang": tgt_lang,
        "translation": translated
    }), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8002, debug=False)
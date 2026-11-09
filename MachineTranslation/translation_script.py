# Transformers Imports
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# PyTorch Imports
import torch

# OS Imports
import os

# Current Directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Absolute Path to the model
model_path = os.path.join(current_dir, "nllb-600M")

# Model Loading
print("Loading model and tokenizer from local disk...")

# Tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)

# Model (CPU, pas de carte graphique)
model = AutoModelForSeq2SeqLM.from_pretrained(
    model_path,
    local_files_only=True,
    dtype=torch.float32
)

model.eval()

print("Model loaded successfully.")


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

    translated_text = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
    return translated_text


# Test de la traduction
texte = "Je veux renouveler mon passeport"

anglais = translate(texte, "fra_Latn", "eng_Latn")
darija = translate(texte, "fra_Latn", "ary_Arab")
arabe = translate(texte, "fra_Latn", "arb_Arab")

# On écrit les résultats dans un fichier (pour bien lire l'arabe)
with open("traduction.txt", "w", encoding="utf-8") as f:
    f.write("Texte   : " + texte + "\n")
    f.write("Anglais : " + anglais + "\n")
    f.write("Darija  : " + darija + "\n")
    f.write("Arabe   : " + arabe + "\n")

print("Traductions enregistrées dans traduction.txt")


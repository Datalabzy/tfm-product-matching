# Instal .env
python -m venv .env_machine_learning 
source .env_machine_learning/bin/activate
pip install -r requirements.txt

# Register to 
python -m pip install --upgrade pip ipykernel
python -m ipykernel install --user --name similaritify --display-name "Python (.env_similaritify)"

### Notebooks

Flujo de cuadernos

0_descarga_conversion.ipynb: guía el origen de datos. Descarga el bruto oficial de SNAP (meta_Pet_Supplies.json.gz), lo descomprime y convierte del pseudo-JSON con comillas simples a un meta_Pet_Supplies.jsonl válido. Incluye validaciones para demostrar que el formato final se lee correctamente.

1_preparacion_datos.ipynb: trabaja con el bruto ya convertido. Extrae registros (título, descripción, categoría), limpia texto y genera dos fichas clave: cats_sample.jsonl (subconjunto normalizado) y cats_labels.txt (lista de etiquetas más frecuentes). Es la base para todos los cuadernos posteriores.

2_creacion_dataset.ipynb: toma cats_sample.jsonl, calcula la categoría hoja, analiza frecuencias (gráficos y estadísticas) y permite elegir un subconjunto de categorías objetivo. Filtra esos registros, crea un label_id numérico y exporta un dataset tabular (data/processed/pet_supplies_dataset.csv). También documenta la calidad del texto (histograma de longitudes) para justificar el input.

3_modelado_taxonomias.ipynb: carga el dataset procesado, divide en train/test estratificados, entrena un pipeline TF‑IDF + LogisticRegression y reporta métricas (accuracy, top‑k, classification report, matriz de confusión). Guarda el modelo (models/pet_taxonomy_logreg.joblib) listo para integrarlo en una API.

2_taxonomia_piloto.ipynb (el original del repo): ahora puedes usarlo como bitácora para las pruebas con el modelo guardado o para comparar enfoques futuros (embeddings, LLM, etc.). Puedes referenciar los outputs de los otros cuadernos desde aquí cuando prepares la demo.
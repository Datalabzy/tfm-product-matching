# Entorno rápido
```bash
python -m venv .env_tfm_product_matching
source .env_tfm_product_matching/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m ipykernel install --user --name tfm-product-matching --display-name "Python (.env_tfm_product_matching)"
```

# Flujo de cuadernos
- `0_descarga_conversion.ipynb`: descarga el bruto SNAP de *Cell Phones & Accessories* (`meta_Cell_Phones_and_Accessories.json.gz`), lo descomprime y lo convierte a JSONL válido.
- `1_preparacion_datos.ipynb`: limpia texto y extrae campos clave (título, descripción, categoría si existe). Genera un sample normalizado.
- `2_preparacion_productos.ipynb`: produce el fichero final `data/products.jsonl` que usa la app, con `id`, `title`, `description`, `image`/`image_url` y `category_path` si el bruto lo trae.
- `3_compute_embeddings_*.ipynb`: scripts opcionales para precomputar embeddings (CLIP ViT/ResNet).

# Notas
- Los outputs intermedios (samples, gráficos, etc.) están fuera de git vía `.gitignore`; solo versionamos el fichero final `data/products.jsonl`.
- Si regeneras el dataset, incluye `category_path` para futuras features. Actualmente la app no depende de él, pero servirá para filtros/analytics más adelante.

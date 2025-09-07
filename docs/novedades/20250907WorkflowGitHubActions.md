---
title: "Documentación del Workflow de GitHub Actions y Python"
date: 2025-09-07
category: ["Automatización"]
tags: ["github-actions", "workflow", "python", "documentacion", "automatizacion"]
draft: false
---
# Workflow Github Actions

* Versión anterior y posterior actualización.

## Versión anterior
```yaml

# Simple workflow for deploying static content to GitHub Pages

name: Deploy static content to Pages

on:

  # Runs on pushes targeting the default branch

  push:

    branches: \["main"]

  # Allows you to run this workflow manually from the Actions tab

  workflow\_dispatch:

# Sets permissions of the GITHUB\_TOKEN to allow deployment to GitHub Pages

permissions:

  contents: read

  pages: write

  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.

# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.

concurrency:

  group: "pages"

  cancel-in-progress: false

jobs:

  # Single deploy job since we're just deploying

  deploy:

    environment:

      name: github-pages

      url: ${{ steps.deployment.outputs.page\_url }}

    runs-on: ubuntu-latest

    steps:

      - name: Checkout

        uses: actions/checkout@v4

      - name: Setup Pages

        uses: actions/configure-pages@v5

      - name: Upload artifact

        uses: actions/upload-pages-artifact@v3

        with:

          # Upload entire repository

          path: '.'

      - name: Deploy to GitHub Pages

        id: deployment

        uses: actions/deploy-pages@v4
```

## Nueva Versión

```yaml
# Workflow para desplegar contenido estático en GitHub Pages
name: Desplegar contenido estático en Pages

# Eventos que disparan el workflow
on:
  # Se ejecuta en cada 'push' a la rama principal (main)
  push:
    branches: ["main"]

  # Permite ejecutar el workflow manualmente desde la pestaña 'Actions'
  workflow_dispatch:

# Otorga permisos al GITHUB_TOKEN para escribir en GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Permite un único despliegue concurrente, evitando que se superpongan
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # Job principal para el despliegue
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Clonar el repositorio
        uses: actions/checkout@v4

      # Instala Python 3 en el entorno de la acción
      - name: Configurar Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'

      # Ejecuta el script de Python para generar el índice de búsqueda
      - name: Generar índice de búsqueda
        run: python generate_index.py

      # Configura GitHub Pages
      - name: Configurar Pages
        uses: actions/configure-pages@v5

      # Sube los archivos para el despliegue
      - name: Subir artefacto
        uses: actions/upload-pages-artifact@v3
        with:
          # Sube todo el repositorio, incluyendo el nuevo índice
          path: '.'

      # Despliega el sitio en GitHub Pages
      - name: Desplegar en GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4


```

import os
import json
import re

# Directorio donde se encuentran los archivos Markdown
DOCS_DIR = "docs"
# Nombre del archivo de índice de búsqueda
INDEX_FILE = os.path.join(DOCS_DIR, "search_index.json")

def count_words(text):
    """Cuenta las palabras de un texto, excluyendo el frontmatter."""
    # Eliminar el frontmatter
    content = re.sub(r"---[\s\S]*?---", "", text, 1)
    # Contar las palabras
    words = content.split()
    return len(words)

def parse_markdown(md_content):
    """Extrae el frontmatter y el contenido de un archivo Markdown."""
    frontmatter_regex = re.compile(r"^---\s*$(.*?)^---\s*$", re.MULTILINE | re.DOTALL)
    match = frontmatter_regex.search(md_content)
    
    data = {}
    content = md_content
    
    if match:
        frontmatter = match.group(1).strip()
        content = md_content[match.end():].strip()
        
        # Parsear el frontmatter
        for line in frontmatter.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                
                # Manejar los diferentes tipos de datos, incluyendo arrays de tags sin comillas
                if value.startswith('[') and value.endswith(']'):
                    data[key] = [v.strip().replace('"', '') for v in value[1:-1].split(',')]
                elif value.startswith('"') and value.endswith('"'):
                    data[key] = value[1:-1]
                else:
                    data[key] = value

    return data, content

def generate_index():
    """Genera el índice de búsqueda a partir de los archivos Markdown."""
    search_index = []
    for root, _, files in os.walk(DOCS_DIR):
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                
                # Evitar los index.md que no son posts
                if file.lower() == "index.md":
                    with open(file_path, "r", encoding="utf-8") as f:
                        md_content = f.read()
                    data, _ = parse_markdown(md_content)
                    if not data.get("title") or "category" not in data:
                        continue # Saltar los index.md que no tienen frontmatter completo
                
                with open(file_path, "r", encoding="utf-8") as f:
                    md_content = f.read()

                # Extraer frontmatter
                frontmatter_data, md_content = parse_markdown(md_content)

                # Generar el slug/url a partir de la ruta del archivo
                slug = os.path.splitext(os.path.relpath(file_path, DOCS_DIR))[0]
                
                # Obtener los datos del frontmatter (o usar valores por defecto)
                title = frontmatter_data.get("title", slug.replace("-", " ").title())
                date = frontmatter_data.get("date", "")
                summary = frontmatter_data.get("summary", "")
                category = frontmatter_data.get("category", ["Sin Categoría"])
                if isinstance(category, str):
                    category = [category]
                tags = frontmatter_data.get("tags", [])

                # Contar palabras
                word_count = count_words(md_content)

                # Si es un post válido, agregarlo al índice
                if title:
                    search_index.append({
                        "id": slug,
                        "title": title,
                        "date": date,
                        "summary": summary,
                        "category": category,
                        "tags": tags,
                        "word_count": word_count
                    })

    # Guardar el índice en un archivo JSON
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(search_index, f, ensure_ascii=False, indent=2)

    print("Índice de búsqueda generado exitosamente.")
    print(f"Archivos procesados: {len(search_index)}")

if __name__ == "__main__":
    generate_index()

# Version actualizada al 6/9/2025 12:45 hs

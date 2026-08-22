#!/usr/bin/env python3
"""
Migra dados de exercícios de arquivos JSON para o Supabase.
Usa as variáveis de ambiente SUPABASE_URL e SUPABASE_KEY.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from supabase import create_client, Client

# Configurar cliente Supabase
url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_KEY", "")

if not url or not key:
    print("Erro: SUPABASE_URL e SUPABASE_KEY não configuradas")
    sys.exit(1)

supabase: Client = create_client(url, key)

# Encontrar arquivos JSON de exercícios
data_dir = Path(__file__).parent.parent / "public" / "data"
subjects = ["matematica", "portugues", "ingles", "geografia", "historia", "ciencias"]

migrated = 0
skipped = 0

for subject in subjects:
    subject_dir = data_dir / subject
    if not subject_dir.exists():
        print(f"⚠️  Diretório {subject} não encontrado")
        continue

    # Pular index.json
    for json_file in subject_dir.glob("*.json"):
        if json_file.name == "index.json":
            continue

        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Criar slug a partir do nome do arquivo
            slug = json_file.stem

            # Extrair dados
            title = data.get("title", data.get("nome", slug))
            description = data.get("description", "")
            materia = data.get("materia", subject)
            ano_letivo = data.get("ano_letivo", "")
            
            # Parse date if available
            exercise_date = data.get("data", None)
            if exercise_date:
                try:
                    exercise_date = datetime.fromisoformat(exercise_date).date()
                except:
                    exercise_date = datetime.now().date()
            else:
                exercise_date = datetime.now().date()

            exercises = data.get("exercises", [])

            # Verificar se já existe
            result = supabase.table("exercise_lists").select("id").eq("subject", subject).eq("slug", slug).execute()
            
            if result.data:
                print(f"⏭️  Pulando {subject}/{slug} (já existe)")
                skipped += 1
                continue

            # Inserir na tabela
            insert_data = {
                "subject": subject,
                "slug": slug,
                "title": title,
                "description": description,
                "materia": materia,
                "ano_letivo": ano_letivo,
                "exercise_date": str(exercise_date),
                "exercises": exercises,
                "published": True,
            }

            response = supabase.table("exercise_lists").insert(insert_data).execute()
            print(f"✅ Migrado {subject}/{slug} ({len(exercises)} exercícios)")
            migrated += 1

        except Exception as e:
            print(f"❌ Erro ao migrar {json_file.name}: {e}")

print(f"\n📊 Resumo: {migrated} listas migradas, {skipped} puladas")

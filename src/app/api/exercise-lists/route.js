import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Obtém os parâmetros da URL
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    
    // Verifica se a matéria foi fornecida
    if (!subject) {
      return NextResponse.json(
        { error: 'Parâmetro subject é obrigatório' }, 
        { status: 400 }
      );
    }
    
    // Constrói o caminho para o diretório de dados
    const dataDir = path.join(process.cwd(), 'src', 'app', 'materias', subject, 'data');
    
    try {
      // Lista todos os arquivos no diretório de dados
      const files = await fs.readdir(dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      // Carrega os metadados de cada lista de exercícios
      const exerciseLists = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(dataDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          
          // Extrai o ID da lista do nome do arquivo
          const id = file.replace('.json', '');
          
          return {
            id,
            title: data.title || data.nome,
            description: data.description,
            date: data.data,
            ano_letivo: data.ano_letivo,
            materia: data.materia
          };
        })
      );
      
      // Ordena por data, mais recentes primeiro
      exerciseLists.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return NextResponse.json(exerciseLists);
    } catch (err) {
      console.error(`Erro ao ler diretório de exercícios: ${err.message}`);
      
      if (err.code === 'ENOENT') {
        return NextResponse.json(
          { error: `Matéria não encontrada: ${subject}` }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao carregar listas de exercícios' }, 
        { status: 500 }
      );
    }
  } catch (err) {
    console.error(`Erro no servidor: ${err.message}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}
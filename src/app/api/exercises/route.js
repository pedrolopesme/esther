import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Obtém os parâmetros da URL
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const listId = searchParams.get('listId');
    
    // Verifica se os parâmetros foram fornecidos
    if (!subject || !listId) {
      return NextResponse.json(
        { error: 'Parâmetros subject e listId são obrigatórios' }, 
        { status: 400 }
      );
    }
    
    // Constrói o caminho para o arquivo JSON
    const dataPath = path.join(process.cwd(), 'src', 'app', 'materias', subject, 'data', `${listId}.json`);
    
    // Lê o arquivo JSON
    try {
      const fileContents = await fs.readFile(dataPath, 'utf8');
      const data = JSON.parse(fileContents);
      
      return NextResponse.json(data);
    } catch (err) {
      console.error(`Erro ao ler arquivo de exercícios: ${err.message}`);
      
      if (err.code === 'ENOENT') {
        return NextResponse.json(
          { error: `Lista de exercícios não encontrada: ${subject}/${listId}` }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao carregar exercícios' }, 
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
import { DashboardCard } from '@/components/molecules/dashboard-card';

const mockTexts = [
  {
    id: '1',
    title: 'O Futuro da Inteligência Artificial',
    description: 'Uma análise profunda sobre como a IA generativa está mudando o mercado de trabalho e a criatividade humana.',
    date: '23 Fev, 2026',
    readingTime: '5 min',
    category: 'Tecnologia'
  },
  {
    id: '2',
    title: 'Guia de Escrita Criativa',
    description: 'Dicas essenciais para desbloquear o bloqueio criativo e desenvolver narrativas envolventes para blogs.',
    date: '22 Fev, 2026',
    readingTime: '8 min',
    category: 'Educação'
  },
  {
    id: '3',
    title: 'Marketing Digital em 2026',
    description: 'As tendências que estão dominando as redes sociais e como as marcas podem se adaptar ao novo algoritmo.',
    date: '20 Fev, 2026',
    readingTime: '6 min',
    category: 'Marketing'
  },
  {
    id: '4',
    title: 'Sustentabilidade Urbana',
    description: 'Como as cidades inteligentes estão implementando soluções verdes para combater as mudanças climáticas.',
    date: '18 Fev, 2026',
    readingTime: '10 min',
    category: 'Ambiente'
  },
  {
    id: '5',
    title: 'A Psicologia das Cores',
    description: 'Entenda como as cores influenciam o comportamento do consumidor e a percepção da marca no design.',
    date: '15 Fev, 2026',
    readingTime: '4 min',
    category: 'Design'
  },
  {
    id: '6',
    title: 'Receitas para Produtividade',
    description: 'Hábitos matinais e técnicas de gestão de tempo que podem dobrar sua entrega diária sem burnout.',
    date: '12 Fev, 2026',
    readingTime: '7 min',
    category: 'Produtividade'
  }
];

export function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockTexts.map((text) => (
        <DashboardCard key={text.id} {...text} />
      ))}
    </div>
  );
}

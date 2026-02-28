import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { FileText, Calendar, Clock } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  date: string;
  readingTime: string;
  category: string;
  onClick?: () => void;
}

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('essay') || cat.includes('redação')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  if (cat.includes('article') || cat.includes('artigo')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (cat.includes('story') || cat.includes('história')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  if (cat.includes('blog') || cat.includes('post')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
  if (cat.includes('social') || cat.includes('redes')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
  if (cat.includes('email') || cat.includes('e-mail')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
  return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
};

export function DashboardCard({ title, description, date, readingTime, category, onClick }: DashboardCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <Badge variant="secondary" className={`border-none ${getCategoryColor(category)}`}>
            {category}
          </Badge>
        </div>
        <CardTitle className="mt-4 line-clamp-1">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-4">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readingTime}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

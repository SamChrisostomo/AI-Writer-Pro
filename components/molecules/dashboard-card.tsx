import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { FileText, Calendar, Clock } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  date: string;
  readingTime: string;
  category: string;
}

export function DashboardCard({ title, description, date, readingTime, category }: DashboardCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <Badge variant="secondary">{category}</Badge>
        </div>
        <CardTitle className="mt-4 line-clamp-1">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
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

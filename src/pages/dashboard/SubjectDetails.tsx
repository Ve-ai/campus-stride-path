import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCourses, useClasses, useGrades, useSubjects, useTeachers } from '@/hooks/useDatabase';

export function SubjectDetails() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { data: subjects } = useSubjects();
  const { data: courses } = useCourses();
  const { data: classes } = useClasses();
  const { data: grades } = useGrades();
  const { data: teachers } = useTeachers();

  const [relatedClasses, setRelatedClasses] = useState<any[]>([]);
  const [averageByClass, setAverageByClass] = useState<Record<string, number>>({});

  const subject = subjects?.find((s) => s.id === subjectId);
  const course = courses?.find((c) => c.id === subject?.course_id);

  useEffect(() => {
    if (!subject || !classes || !grades) return;

    const subjectClassGrades = (grades as any[]).filter(
      (g) => g.subject_id === subject.id,
    );

    const byClass = new Map<string, { total: number; count: number }>();

    subjectClassGrades.forEach((g) => {
      const mt1 = g.mac != null && g.npt != null ? (g.mac + g.npt) / 2 : null;
      if (mt1 == null) return;
      const key = g.class_id as string;
      const current = byClass.get(key) || { total: 0, count: 0 };
      current.total += mt1;
      current.count += 1;
      byClass.set(key, current);
    });

    const avg: Record<string, number> = {};
    byClass.forEach((value, key) => {
      avg[key] = value.count > 0 ? value.total / value.count : 0;
    });
    setAverageByClass(avg);

    const related = classes.filter((c: any) => avg[c.id] !== undefined);
    setRelatedClasses(related as any[]);
  }, [subject, classes, grades]);

  if (!subject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Disciplina não encontrada</p>
      </div>
    );
  }

  const bestClasses = [...relatedClasses].sort(
    (a, b) => (averageByClass[b.id] || 0) - (averageByClass[a.id] || 0),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            {subject.name}
          </h1>
          <p className="text-muted-foreground">
            Curso: {course?.name || '-'} • Classe: {subject.grade_level}ª
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turmas com avaliação</p>
                <p className="text-2xl font-bold">{relatedClasses.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Melhor turma</p>
                <p className="text-2xl font-bold">
                  {bestClasses[0]
                    ? `${bestClasses[0].grade_level}ª ${bestClasses[0].section}`
                    : '-'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Turmas e aproveitamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Turma</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-center">Média da disciplina</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bestClasses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Ainda não existem dados de avaliação para esta disciplina.
                  </TableCell>
                </TableRow>
              )}
              {bestClasses.map((cls) => (
                <TableRow key={cls.id} className="table-row-hover">
                  <TableCell className="font-medium">
                    {cls.grade_level}ª {cls.section}
                  </TableCell>
                  <TableCell>{cls.period}</TableCell>
                  <TableCell className="text-center">
                    {(averageByClass[cls.id] || 0).toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

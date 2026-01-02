import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpdateCourse } from '@/hooks/useDatabase';

interface CourseEditFormProps {
  course: any;
  onClose: () => void;
  onUpdated: () => void;
}

export function CourseEditForm({ course, onClose, onUpdated }: CourseEditFormProps) {
  const updateCourse = useUpdateCourse();
  const [name, setName] = useState(course.name || '');
  const [monthly10, setMonthly10] = useState(course.monthly_fee_10?.toString() || '');
  const [monthly11, setMonthly11] = useState(course.monthly_fee_11?.toString() || '');
  const [monthly12, setMonthly12] = useState(course.monthly_fee_12?.toString() || '');
  const [monthly13, setMonthly13] = useState(course.monthly_fee_13?.toString() || '');

  const handleSave = () => {
    updateCourse.mutate(
      {
        id: course.id,
        name,
        monthly_fee_10: monthly10 ? Number(monthly10) : undefined,
        monthly_fee_11: monthly11 ? Number(monthly11) : undefined,
        monthly_fee_12: monthly12 ? Number(monthly12) : undefined,
        monthly_fee_13: monthly13 ? Number(monthly13) : undefined,
      },
      {
        onSuccess: () => {
          onUpdated();
          onClose();
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do curso</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Mensalidade 10ª</Label>
          <Input
            type="number"
            value={monthly10}
            onChange={(e) => setMonthly10(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Mensalidade 11ª</Label>
          <Input
            type="number"
            value={monthly11}
            onChange={(e) => setMonthly11(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Mensalidade 12ª</Label>
          <Input
            type="number"
            value={monthly12}
            onChange={(e) => setMonthly12(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Mensalidade 13ª</Label>
          <Input
            type="number"
            value={monthly13}
            onChange={(e) => setMonthly13(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="btn-primary" onClick={handleSave} disabled={updateCourse.isPending}>
          {updateCourse.isPending ? 'A guardar...' : 'Guardar alterações'}
        </Button>
      </div>
    </div>
  );
}

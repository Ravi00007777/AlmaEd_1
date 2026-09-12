import Link from 'next/link';
import { cn } from '@/components/ui/cn';
import { Badge } from '@/components/ui/badge';

export function DoubtStudentPicker({
  basePath,
  students,
  selectedStudentId,
  counts,
}: {
  basePath: string;
  students: { id: string; name: string }[];
  selectedStudentId: string;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {students.map((student) => {
        const active = student.id === selectedStudentId;
        return (
          <Link
            key={student.id}
            href={`${basePath}?student=${student.id}`}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {student.name}
            {counts[student.id] ? <Badge variant="neutral">{counts[student.id]}</Badge> : null}
          </Link>
        );
      })}
    </div>
  );
}

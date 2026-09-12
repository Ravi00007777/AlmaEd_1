import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ResourceTypeBadge, Badge } from '@/components/ui/badge';
import { BookOpenIcon, ExternalLinkIcon } from '@/components/ui/icons';

type ResourceRow = {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  createdAt: Date;
  dueAt: Date | null;
};

export function ResourcesTable({ resources }: { resources: ResourceRow[] }) {
  if (resources.length === 0) {
    return (
      <EmptyState
        icon={<BookOpenIcon className="h-8 w-8" />}
        title="Nothing shared yet"
        description="Assignments, tests, and notes will show up here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Shared on</TableHead>
          <TableHead>Deadline</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((resource) => {
          const overdue = resource.dueAt !== null && new Date(resource.dueAt) < new Date();
          return (
            <TableRow key={resource.id}>
              <TableCell>
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  {resource.title}
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </TableCell>
              <TableCell>
                <ResourceTypeBadge type={resource.type} />
              </TableCell>
              <TableCell>{new Date(resource.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                {resource.dueAt ? (
                  <span className={`inline-flex items-center gap-2 ${overdue ? 'text-rose-600 font-medium' : ''}`}>
                    {new Date(resource.dueAt).toLocaleString()}
                    {overdue && <Badge variant="danger">Overdue</Badge>}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

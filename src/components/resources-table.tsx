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
    return <p className="text-sm text-gray-500">Nothing shared yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th className="py-2 pr-4">Title</th>
          <th className="py-2 pr-4">Type</th>
          <th className="py-2 pr-4">Shared on</th>
          <th className="py-2">Deadline</th>
        </tr>
      </thead>
      <tbody>
        {resources.map((resource) => (
          <tr key={resource.id} className="border-b border-gray-100">
            <td className="py-2 pr-4">
              <a href={resource.fileUrl} target="_blank" className="text-blue-600 underline">
                {resource.title}
              </a>
            </td>
            <td className="py-2 pr-4">{resource.type}</td>
            <td className="py-2 pr-4">{new Date(resource.createdAt).toLocaleDateString()}</td>
            <td className="py-2">
              {resource.dueAt ? new Date(resource.dueAt).toLocaleString() : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

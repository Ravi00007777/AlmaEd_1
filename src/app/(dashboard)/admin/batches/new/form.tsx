'use client';

import { useFormState } from 'react-dom';
import { Field, Input, Select, SubmitButton, ErrorText } from '@/components/form';

type Person = { id: string; name: string; email: string };
type ActionResult = { error?: string } | undefined;

export function NewBatchForm({
  teachers,
  students,
  action,
}: {
  teachers: Person[];
  students: Person[];
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Batch name">
        <Input name="name" placeholder="e.g. Grade 8 Math" required />
      </Field>

      <Field label="Teacher">
        <Select name="teacherId" required defaultValue="">
          <option value="" disabled>
            Select a teacher
          </option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name} ({teacher.email})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Google Meet link">
        <Input name="meetLink" type="url" placeholder="https://meet.google.com/..." required />
      </Field>

      <Field label="Schedule note (optional)">
        <Input name="scheduleNote" placeholder="e.g. Tue/Thu 5:00pm IST" />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">Students</legend>
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border border-slate-300 p-2">
          {students.map((student) => (
            <label key={student.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                name="studentIds"
                value={student.id}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {student.name} ({student.email})
            </label>
          ))}
          {students.length === 0 && (
            <p className="text-sm text-slate-500">No students registered yet.</p>
          )}
        </div>
      </fieldset>

      <ErrorText>{state?.error}</ErrorText>
      <SubmitButton>Create batch</SubmitButton>
    </form>
  );
}

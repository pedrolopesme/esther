import { Suspense } from "react";
import QueryExerciseListClient from "../../../../components/QueryExerciseListClient";
import { SUBJECTS } from "../../../../utils/subjects";

export function generateStaticParams() {
  return SUBJECTS.map(({ id }) => ({ subject: id }));
}

export default function SubjectExercisePage({ params }) {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-ink-soft">Carregando exercícios...</div>}>
      <QueryExerciseListClient subject={params.subject} />
    </Suspense>
  );
}

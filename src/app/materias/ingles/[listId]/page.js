import RequireAuth from "../../../../components/RequireAuth";
import ExerciseListClient from '../../../../components/ExerciseListClient';
import { generateStaticParamsForSubject } from '../../../../utils/staticParams';

export function generateStaticParams() {
  return generateStaticParamsForSubject('ingles');
}

export default function ExerciseListPage() {
  return <ExerciseListClient subject="ingles" />;
}

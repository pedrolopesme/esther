import ExerciseListClient from '../../../../components/ExerciseListClient';
import { generateStaticParamsForSubject } from '../../../../utils/staticParams';

export function generateStaticParams() {
  return generateStaticParamsForSubject('geografia');
}

export default function ExerciseListPage() {
  return <ExerciseListClient subject="geografia" />;
}

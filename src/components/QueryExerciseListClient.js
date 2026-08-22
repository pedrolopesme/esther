"use client";

import { useSearchParams } from "next/navigation";
import ExerciseListClient from "./ExerciseListClient";

export default function QueryExerciseListClient({ subject }) {
  const searchParams = useSearchParams();
  return <ExerciseListClient subject={subject} listId={searchParams.get("listId")} />;
}

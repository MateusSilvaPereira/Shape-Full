export interface Exercise {
  id: string;
  academyId: string;
  name: string;
  muscleGroup: string;
  instructions: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ExerciseFormValues {
  name: string;
  muscleGroup: string;
  instructions?: string;
  videoUrl?: string;
}

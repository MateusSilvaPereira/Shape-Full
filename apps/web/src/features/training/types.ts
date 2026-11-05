export interface TrainingItem {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string | null;
  order: number;
  exercise: {
    id: string;
    imageUrl: string | null;
    videoUrl: string | null;
    instructions: string | null;
    muscleGroup: string;
  } | null;
}

export interface TrainingProgram {
  id: string;
  academyId: string;
  studentId: string | null;
  createdById: string;
  title: string;
  description: string | null;
  goal: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  items: TrainingItem[];
  student: {
    id: string;
    user: { id: string; name: string };
  } | null;
  createdBy: { id: string; name: string };
}

export interface TrainingItemInput {
  exerciseId?: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
}

export interface TrainingProgramFormValues {
  title: string;
  description?: string;
  goal?: string;
  active?: boolean;
  studentId?: string;
  items: TrainingItemInput[];
}

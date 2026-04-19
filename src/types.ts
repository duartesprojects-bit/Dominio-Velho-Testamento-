export interface Scripture {
  id: string;
  reference: string;
  historicalContext: string;
  doctrinalTeaching: string;
  missionaryApplication: string;
  personalApplication: string;
  text: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  studyGoalMinutes: number;
  notificationTime: string; // HH:mm format
  isAdmin: boolean;
}

export interface UserNote {
  id?: string;
  userId: string;
  scriptureId: string;
  content: string;
  updatedAt: string;
}

export interface Favorite {
  id?: string;
  userId: string;
  scriptureId: string;
}

export interface StudySession {
  id?: string;
  userId: string;
  startTime: string;
  durationMinutes: number;
}

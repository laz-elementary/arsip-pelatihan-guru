export type TrainingCategory = 
  | 'Pedagogik'
  | 'Kurikulum Merdeka'
  | 'Digital & IT Learning'
  | 'Inklusi & ABK'
  | 'Leadership & Manajerial'
  | 'Pengembangan Karakter & Islam'
  | 'Metode Montessori'
  | 'Lain-lain'
  | string;

export interface Teacher {
  id: string;
  name: string;
  nip?: string;
  role?: string;
  email?: string;
}

export interface TrainingRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherRole?: string;
  trainingName: string;
  organizer: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  hours: number; // JP (Jam Pelajaran)
  category: TrainingCategory;
  location: string; // e.g. "SD Lazuardi Depok", "Online via Zoom", "Kemendikbud Jakarta"
  notes?: string; // Catatan & hasil materi yang didapat
  
  // Certificate file & Drive URL
  certificateUrl?: string; // Direct link or preview URL
  certificateDriveUrl: string; // Drive link (defaults to the provided folder)
  certificateFileName?: string;
  
  // Material file & Drive URL
  materialUrl?: string; // Direct link or preview URL
  materialDriveUrl: string; // Drive link (defaults to the provided folder)
  materialFileName?: string;
  
  // AI summary cache (optional)
  aiSummary?: string;
  aiActionPlan?: string[];
  
  createdAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  category: string;
  teacherName: string;
  year: string;
  sortBy: 'dateDesc' | 'dateAsc' | 'teacherName' | 'hoursDesc';
}

export const DRIVE_FOLDERS = {
  CERTIFICATES: 'https://drive.google.com/drive/folders/1YONRvdVcMktQ5t2WOvI6KML2UM74KNlW?usp=drive_link',
  MATERIALS: 'https://drive.google.com/drive/folders/1E1LnuMEuosY9nsQUhY-zQyBGfZzpK1sY?usp=drive_link'
};

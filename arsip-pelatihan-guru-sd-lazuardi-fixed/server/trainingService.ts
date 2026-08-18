import { createClient } from '@supabase/supabase-js';

export interface TrainingPayload {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherRole?: string;
  trainingName: string;
  organizer: string;
  startDate: string;
  endDate: string;
  hours: number;
  category: string;
  location: string;
  notes?: string;
  certificateDriveUrl?: string;
  certificateFileName?: string;
  materialDriveUrl?: string;
  materialFileName?: string;
  aiSummary?: string;
  aiActionPlan?: string[];
  createdAt?: string;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada server.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toDatabaseRow(record: TrainingPayload) {
  return {
    id: record.id,
    teacher_id: record.teacherId,
    teacher_name: record.teacherName,
    teacher_role: record.teacherRole || null,
    training_name: record.trainingName,
    organizer: record.organizer,
    start_date: record.startDate,
    end_date: record.endDate,
    hours: Number(record.hours) || 0,
    category: record.category,
    location: record.location,
    notes: record.notes || null,
    certificate_drive_url: record.certificateDriveUrl || null,
    certificate_file_name: record.certificateFileName || null,
    material_drive_url: record.materialDriveUrl || null,
    material_file_name: record.materialFileName || null,
    ai_summary: record.aiSummary || null,
    ai_action_plan: record.aiActionPlan || null,
    created_at: record.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function fromDatabaseRow(row: any): TrainingPayload & { createdAt: string } {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    teacherRole: row.teacher_role || '',
    trainingName: row.training_name,
    organizer: row.organizer || '',
    startDate: row.start_date,
    endDate: row.end_date || row.start_date,
    hours: Number(row.hours) || 0,
    category: row.category || 'Lain-lain',
    location: row.location || '',
    notes: row.notes || '',
    certificateDriveUrl: row.certificate_drive_url || '',
    certificateFileName: row.certificate_file_name || '',
    materialDriveUrl: row.material_drive_url || '',
    materialFileName: row.material_file_name || '',
    aiSummary: row.ai_summary || undefined,
    aiActionPlan: Array.isArray(row.ai_action_plan) ? row.ai_action_plan : undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function listTrainings() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Gagal membaca arsip pelatihan dari Supabase: ${error.message}`);
  }

  return (data || []).map(fromDatabaseRow);
}

export async function upsertTraining(record: TrainingPayload) {
  const supabase = getSupabaseClient();
  const row = toDatabaseRow(record);
  const { data, error } = await supabase
    .from('trainings')
    .upsert([row], { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    const detail = [error.code, error.message, error.details, error.hint]
      .filter(Boolean)
      .join(' | ');
    throw new Error(`Gagal menyimpan arsip pelatihan ke Supabase: ${detail}`);
  }

  return fromDatabaseRow(data);
}

export async function deleteTraining(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('trainings')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Gagal menghapus arsip pelatihan dari Supabase: ${error.message}`);
  }

  return { id };
}

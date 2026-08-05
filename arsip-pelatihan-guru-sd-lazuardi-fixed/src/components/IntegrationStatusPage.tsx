import React, { useState, useEffect } from 'react';
import { 
  Server, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, 
  RefreshCw, Database, Cloud, FolderCheck, Key, Copy, Check, FileCode
} from 'lucide-react';

interface DiagnosticResult {
  timestamp: string;
  envVars: {
    GOOGLE_CLIENT_EMAIL: { configured: boolean; value?: string };
    GOOGLE_PRIVATE_KEY: { configured: boolean; value?: string };
    GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID: { configured: boolean; value?: string };
    GOOGLE_DRIVE_MATERIAL_FOLDER_ID: { configured: boolean; value?: string };
    SUPABASE_URL: { configured: boolean; value?: string };
    SUPABASE_SERVICE_ROLE_KEY: { configured: boolean; value?: string };
  };
  supabase: {
    connected: boolean;
    tableAvailable: boolean;
    message: string;
    tableName: string;
  };
  googleDrive: {
    authConnected: boolean;
    authMessage: string;
    clientEmail: string | null;
    certFolder: {
      found: boolean;
      name: string | null;
      message: string;
    };
    matFolder: {
      found: boolean;
      name: string | null;
      message: string;
    };
  };
}

export const IntegrationStatusPage: React.FC = () => {
  const [data, setData] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const sqlSnippet = `-- Jalankan sekali di Supabase > SQL Editor
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.trainings (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  teacher_role TEXT,
  training_name TEXT NOT NULL,
  organizer TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  hours INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  location TEXT,
  notes TEXT,
  certificate_drive_url TEXT,
  certificate_file_name TEXT,
  material_drive_url TEXT,
  material_file_name TEXT,
  ai_summary TEXT,
  ai_action_plan JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  web_view_link TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  file_type TEXT CHECK (file_type IN ('certificate', 'material')),
  training_id TEXT,
  upload_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.training_files ADD COLUMN IF NOT EXISTS upload_id TEXT;
ALTER TABLE public.training_files ADD COLUMN IF NOT EXISTS training_id TEXT;

DROP INDEX IF EXISTS public.training_files_upload_id_unique;
CREATE UNIQUE INDEX training_files_upload_id_unique
ON public.training_files (upload_id);

CREATE UNIQUE INDEX IF NOT EXISTS training_files_drive_file_id_unique
ON public.training_files (drive_file_id);

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_files ENABLE ROW LEVEL SECURITY;`;

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integration-health');
      if (!res.ok) {
        throw new Error(`Server merespon dengan status ${res.status}`);
      }
      const result: DiagnosticResult = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Gagal menghubungi server untuk pemeriksaan status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1c59c6]/10 text-[#1c59c6] flex items-center justify-center shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2C3327] flex items-center gap-2">
              <span>Status Integrasi Live System</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Read-Only Diagnostic
              </span>
            </h2>
            <p className="text-xs text-[#7A756D] mt-0.5">
              Pemeriksaan jaringan dan konektivitas langsung ke Google Drive API & Database Supabase (Tanpa Mengubah Data)
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1c59c6] hover:bg-[#1547a1] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Menguji Koneksi...' : 'Uji Ulang Koneksi Nyata'}</span>
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-emerald-900">Jaminan Keamanan Kunci Rahasia:</p>
          <p className="text-[11px] leading-relaxed text-emerald-800">
            Pemeriksaan ini tidak mengunggah file pengujian dan tidak mengubah data apa pun. Seluruh Private Key dan Service Role Key secara ketat dirahasiakan dan ditutup dari peramban client.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center space-x-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="bg-white p-12 rounded-3xl border border-[#E5E2D9] text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#1c59c6] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2C3327]">Memeriksa status koneksi nyata Supabase dan Google Drive API...</p>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supabase Status Card */}
          <div className="bg-white rounded-3xl border border-[#E5E2D9] shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 bg-[#faf8f5] border-b border-[#E5E2D9] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#2C3327]">1. Database Supabase</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                data.supabase.connected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {data.supabase.connected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                <span>{data.supabase.connected ? 'Supabase Terhubung' : 'Gagal Terhubung'}</span>
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs flex-1">
              {/* Environment Variables Readability */}
              <div className="space-y-2">
                <p className="font-semibold text-[#7A756D] uppercase text-[10px] tracking-wider">Status Variable Environment:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-[#F8F7F4] rounded-xl border border-[#E5E2D9] flex justify-between items-center">
                    <span className="font-sans font-medium text-[#2C3327]">SUPABASE_URL</span>
                    {data.envVars.SUPABASE_URL.configured ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terbaca
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Tidak Terbaca
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-[#F8F7F4] rounded-xl border border-[#E5E2D9] flex justify-between items-center">
                    <span className="font-sans font-medium text-[#2C3327]">SERVICE_ROLE_KEY</span>
                    {data.envVars.SUPABASE_SERVICE_ROLE_KEY.configured ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" /> Key Ada
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Tidak Terbaca
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Availability */}
              <div className="pt-2 border-t border-[#E5E2D9] space-y-2">
                <p className="font-semibold text-[#7A756D] uppercase text-[10px] tracking-wider">Ketersediaan Tabel Database:</p>
                <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E5E2D9] flex items-center justify-between">
                  <span className="font-bold text-[#2C3327]">Tabel '{data.supabase.tableName}'</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    data.supabase.tableAvailable 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {data.supabase.tableAvailable ? 'Tabel Tersedia' : 'Belum Tersedia'}
                  </span>
                </div>
              </div>

              {/* Message Details */}
              <div className={`p-3.5 rounded-2xl text-xs border leading-relaxed ${
                data.supabase.connected && data.supabase.tableAvailable
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                  : 'bg-amber-50 text-amber-950 border-amber-200'
              }`}>
                <p className="font-bold mb-1">Pesan Hasil Pemeriksaan:</p>
                <p>{data.supabase.message}</p>
              </div>

              {/* SQL Helper if table is missing */}
              {!data.supabase.tableAvailable && (
                <div className="mt-3 p-4 bg-amber-50/60 border border-amber-300 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-amber-700" /> Skrip SQL Pembuat Tabel (Salin ke Supabase SQL Editor):
                    </span>
                    <button
                      onClick={handleCopySql}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-700 text-white font-bold text-[11px] hover:bg-amber-800 transition-all cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-amber-200 text-[10px] rounded-xl overflow-x-auto font-mono max-h-40">
                    {sqlSnippet}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Google Drive Status Card */}
          <div className="bg-white rounded-3xl border border-[#E5E2D9] shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 bg-[#faf8f5] border-b border-[#E5E2D9] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Cloud className="w-5 h-5 text-[#1c59c6]" />
                <h3 className="text-sm font-bold text-[#2C3327]">2. Google Drive API</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                data.googleDrive.authConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {data.googleDrive.authConnected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                <span>{data.googleDrive.authConnected ? 'Google Drive Terhubung' : 'Gagal Terhubung'}</span>
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs flex-1">
              {/* Service Account Auth Info */}
              <div className="space-y-2">
                <p className="font-semibold text-[#7A756D] uppercase text-[10px] tracking-wider">Service Account Credential:</p>
                <div className="p-3 bg-[#F8F7F4] rounded-xl border border-[#E5E2D9] space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-[#7A756D]">Client Email:</span>
                    <span className="text-[#2C3327] font-bold truncate max-w-[200px] sm:max-w-[280px]">
                      {data.googleDrive.clientEmail || 'Belum diisi'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#E5E2D9]">
                    <span className="font-sans text-[#7A756D]">Private Key:</span>
                    <span className="text-emerald-700 font-bold">
                      {data.envVars.GOOGLE_PRIVATE_KEY.configured ? '*** Encrypted Key OK' : 'Belum diisi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Folder Status */}
              <div className="pt-2 border-t border-[#E5E2D9] space-y-2">
                <p className="font-semibold text-[#7A756D] uppercase text-[10px] tracking-wider">Pemeriksaan Folder Sertifikat:</p>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  data.googleDrive.certFolder.found ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                }`}>
                  <div>
                    <span className="font-bold block text-[#2C3327]">
                      {data.googleDrive.certFolder.name || 'Folder Sertifikat'}
                    </span>
                    <span className="text-[11px] text-[#7A756D] font-mono">
                      ID: {data.envVars.GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID.value || '-'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    data.googleDrive.certFolder.found ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {data.googleDrive.certFolder.found ? 'Folder Ditemukan' : 'Folder Gagal'}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A756D] leading-normal">{data.googleDrive.certFolder.message}</p>
              </div>

              {/* Material Folder Status */}
              <div className="pt-2 border-t border-[#E5E2D9] space-y-2">
                <p className="font-semibold text-[#7A756D] uppercase text-[10px] tracking-wider">Pemeriksaan Folder Materi:</p>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  data.googleDrive.matFolder.found ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                }`}>
                  <div>
                    <span className="font-bold block text-[#2C3327]">
                      {data.googleDrive.matFolder.name || 'Folder Materi'}
                    </span>
                    <span className="text-[11px] text-[#7A756D] font-mono">
                      ID: {data.envVars.GOOGLE_DRIVE_MATERIAL_FOLDER_ID.value || '-'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    data.googleDrive.matFolder.found ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {data.googleDrive.matFolder.found ? 'Folder Ditemukan' : 'Folder Gagal'}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A756D] leading-normal">{data.googleDrive.matFolder.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { 
  X, Calendar, ExternalLink, BookOpen,
  FolderCheck, FileText, UserCheck, MapPin, Wifi
} from 'lucide-react';
import { TrainingRecord, DRIVE_FOLDERS } from '../types';

interface TrainingDetailModalProps {
  record: TrainingRecord | null;
  onClose: () => void;
  onUpdateRecordAiPlan: (recordId: string, aiSummary: string, aiActionPlan: string[]) => void;
}

export const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null;

  const rawLocation = (record.location || '').trim();
  const isOnline = /^(online)(?:\s*[-–—:]\s*)?/i.test(rawLocation)
    || (!/^(offline)(?:\s*[-–—:]\s*)?/i.test(rawLocation)
      && /(zoom|google\s*meet|microsoft\s*teams|webinar|daring|online)/i.test(rawLocation));
  const locationDetail = rawLocation
    .replace(/^(online|offline)(?:\s*[-–—:]\s*)?/i, '')
    .trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C3327]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-[#E5E2D9] overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#0f2857] text-white px-6 py-5 flex items-start justify-between">
          <div className="space-y-1 pr-6">
            <div className="flex items-center space-x-2">
              <span className="bg-[#1c59c6] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {record.category}
              </span>
              <span className="text-[#D9D5CB] text-xs font-mono">{record.hours} JP (Jam Pelajaran)</span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{record.trainingName}</h2>
            <p className="text-xs text-[#93c5fd] font-medium">
              Oleh {record.teacherName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#c0d4ff] hover:text-white hover:bg-[#1547a1] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2D9] text-xs">
            <div>
              <span className="text-[#7A756D] font-medium block mb-0.5">Penyelenggara</span>
              <span className="font-bold text-[#2C3327] flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#1c59c6]" /> {record.organizer}
              </span>
            </div>
            <div>
              <span className="text-[#7A756D] font-medium block mb-0.5">Tanggal Pelaksanaan</span>
              <span className="font-bold text-[#2C3327] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1c59c6]" /> {record.startDate} {record.endDate && record.endDate !== record.startDate ? `s/d ${record.endDate}` : ''}
              </span>
            </div>
            <div>
              <span className="text-[#7A756D] font-medium block mb-0.5">Metode</span>
              <span className="font-bold text-[#2C3327] flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-[#1c59c6]" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                )}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div>
              <span className="text-[#7A756D] font-medium block mb-0.5">
                {isOnline ? 'Platform / Media' : 'Lokasi Kegiatan'}
              </span>
              <span className="font-bold text-[#2C3327] flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-[#1c59c6]" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                )}
                {locationDetail || (isOnline ? 'Online' : 'Belum dicantumkan')}
              </span>
            </div>
          </div>

          {/* Teacher Notes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A756D] mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1c59c6]" /> Refleksi Hasil Pelatihan
            </h4>
            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2D9] text-xs text-[#2C3327] leading-relaxed whitespace-pre-wrap">
              {record.notes || 'Belum ada refleksi hasil pelatihan dari peserta.'}
            </div>
          </div>

          {/* Drive & File Links Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sertifikat Card */}
            <div className="bg-[#edf3fc] p-4 rounded-2xl border border-[#d2e3fc] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#2C3327] flex items-center gap-1.5">
                    <FolderCheck className="w-4 h-4 text-[#1c59c6]" /> Sertifikat Pendukung
                  </span>
                  <span className="text-[10px] bg-white text-[#1c59c6] font-bold px-2 py-0.5 rounded-md border border-[#d2e3fc]">Real-time</span>
                </div>
                <p className="text-[11px] text-[#7A756D]">
                  {record.certificateFileName || 'Sertifikat_Pelatihan_Guru.pdf'}
                </p>
              </div>

              {/* Certificate Image Preview if available */}
              {record.certificateUrl && (
                <div className="rounded-xl overflow-hidden border border-[#D9D5CB] max-h-36 bg-black/5">
                  <img 
                    src={record.certificateUrl} 
                    alt="Sertifikat Pelatihan" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-1.5">
                {record.certificateUrl && (
                  <a
                    href={record.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-white border border-[#1c59c6] text-[#1c59c6] hover:bg-[#edf3fc] rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-2 shadow-xs"
                  >
                    <span>Lihat / Unduh File Upload Lokal</span>
                    <FileText className="w-3.5 h-3.5" />
                  </a>
                )}

                <a
                  href={record.certificateDriveUrl || DRIVE_FOLDERS.CERTIFICATES}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-[#1c59c6] hover:bg-[#1547a1] text-white rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-2 shadow-xs"
                >
                  <span>Buka di Drive Sertifikat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Bahan Materi Card */}
            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2D9] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#2C3327] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#B8860B]" /> Bahan Materi & Slide
                  </span>
                  <span className="text-[10px] bg-[#E5E2D9] text-[#2C3327] font-bold px-2 py-0.5 rounded-md">Manajemen</span>
                </div>
                <p className="text-[11px] text-[#7A756D]">
                  {record.materialFileName || 'Modul_Materi_Training.pdf'}
                </p>
              </div>

              {record.materialUrl && (
                <div className="rounded-xl overflow-hidden border border-[#E5E2D9] max-h-36 bg-[#F2EFE9] p-3 text-xs text-[#7A756D] flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-[#C0C7B9]" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-1.5">
                {record.materialUrl && (
                  <a
                    href={record.materialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-white border border-[#1547a1] text-[#1547a1] hover:bg-[#edf3fc] rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-2 shadow-xs"
                  >
                    <span>Lihat / Unduh File Upload Lokal</span>
                    <FileText className="w-3.5 h-3.5" />
                  </a>
                )}

                <a
                  href={record.materialDriveUrl || DRIVE_FOLDERS.MATERIALS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-[#1547a1] hover:bg-[#0f2857] text-white rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-2 shadow-xs"
                >
                  <span>Buka di Drive Bahan Materi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

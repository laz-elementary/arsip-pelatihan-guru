import React, { useState } from 'react';
import { 
  X, Calendar, Award, ExternalLink, Sparkles, BookOpen, 
  FolderCheck, CheckCircle2, FileText, UserCheck, MapPin, 
  RefreshCw, Check, Lightbulb 
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
  onUpdateRecordAiPlan,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  if (!record) return null;

  // Generate Gemini AI Action Plan for Classroom Implementation
  const handleGenerateAiPlan = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/generate-ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingName: record.trainingName,
          notes: record.notes,
          teacherRole: record.teacherRole,
          category: record.category,
        }),
      });

      const data = await res.json();
      if (data.summary && data.actionPlan) {
        onUpdateRecordAiPlan(record.id, data.summary, data.actionPlan);
      }
    } catch (err) {
      console.error('Failed to generate AI plan:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Generate Gemini AI Next Training Recommendations
  const handleGetRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const res = await fetch('/api/recommend-trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherName: record.teacherName,
          role: record.teacherRole,
          completedTrainings: [record.trainingName],
        }),
      });
      const data = await res.json();
      if (data.recommendations) {
        setAiRecommendations(data.recommendations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRecs(false);
    }
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2D9] text-xs">
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
              <span className="text-[#7A756D] font-medium block mb-0.5">Lokasi Kegiatan</span>
              <span className="font-bold text-[#2C3327] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#B8860B]" /> {record.location || 'SD Lazuardi'}
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

          {/* AI Action Plan & Rencana Penerapan di SD Lazuardi */}
          <div className="bg-[#0f2857] text-white p-5 rounded-2xl border border-[#1547a1] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#1c59c6]/40 rounded-xl text-[#93c5fd]">
                  <Sparkles className="w-5 h-5 text-[#93c5fd]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Gemini AI: Rencana Aksi Kelas & Ringkasan</h4>
                  <p className="text-[11px] text-[#bfdbfe]">Rekomendasi implementasi praktis di SD Lazuardi</p>
                </div>
              </div>

              <button
                onClick={handleGenerateAiPlan}
                disabled={isGeneratingAi}
                className="px-3 py-1.5 bg-[#1c59c6] hover:bg-[#1547a1] disabled:bg-[#1e3a8a] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Menganalisis AI...' : record.aiActionPlan ? 'Perbarui AI Plan' : 'Generate AI Plan'}</span>
              </button>
            </div>

            {record.aiSummary && (
              <div className="bg-white/10 p-3.5 rounded-xl text-xs text-[#e8f0fe] border border-white/10">
                <strong className="text-white block mb-1">Ringkasan Eksekutif:</strong>
                {record.aiSummary}
              </div>
            )}

            {record.aiActionPlan && record.aiActionPlan.length > 0 && (
              <div className="space-y-2">
                <strong className="text-xs text-[#93c5fd] block">Tindakan Aksi Kelas (Action Items):</strong>
                <ul className="space-y-2 text-xs text-[#D9D5CB]">
                  {record.aiActionPlan.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-[#93c5fd] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!record.aiActionPlan && !isGeneratingAi && (
              <p className="text-xs text-[#c0d4ff] italic">
                Klik tombol "Generate AI Plan" untuk membuat rekomendasi penerapan materi pelatihan ini secara otomatis bagi guru SD Lazuardi.
              </p>
            )}
          </div>

          {/* AI Next Recommendations */}
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2D9]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-[#2C3327] flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#B8860B]" /> Rekomendasi Pelatihan Selanjutnya (CPD Guru)
              </h4>
              <button
                onClick={handleGetRecommendations}
                disabled={isLoadingRecs}
                className="text-xs text-[#1c59c6] hover:underline font-bold"
              >
                {isLoadingRecs ? 'Memuat AI...' : 'Dapatkan Rekomendasi AI'}
              </button>
            </div>

            {aiRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aiRecommendations.map((rec, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-[#E5E2D9] text-xs">
                    <span className="text-[10px] font-bold bg-[#F3E7C4] text-[#B8860B] px-2 py-0.5 rounded-md">
                      {rec.category}
                    </span>
                    <h5 className="font-bold text-[#2C3327] mt-1">{rec.title}</h5>
                    <p className="text-[11px] text-[#7A756D] mt-0.5">{rec.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7A756D]">
                Klik "Dapatkan Rekomendasi AI" untuk melihat rekomendasi program pengembangan profesi guru berikutnya berdasarkan riwayat ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

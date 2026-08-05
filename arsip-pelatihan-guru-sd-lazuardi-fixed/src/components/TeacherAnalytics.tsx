import React, { useState } from 'react';
import { Award, Users, PlusCircle, Search, TrendingUp, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { Teacher, TrainingRecord } from '../types';

interface TeacherAnalyticsProps {
  teachers: Teacher[];
  trainings: TrainingRecord[];
  onAddTeacher: (teacher: Teacher) => void;
  onFilterByTeacher: (teacherName: string) => void;
}

export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({
  teachers,
  trainings,
  onAddTeacher,
  onFilterByTeacher,
}) => {
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState('');
  const [newTeacherNip, setNewTeacherNip] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName) return;

    onAddTeacher({
      id: 't-' + Date.now(),
      name: newTeacherName,
      role: newTeacherRole || 'Guru SD Lazuardi',
      nip: newTeacherNip || `LZU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    });

    setNewTeacherName('');
    setNewTeacherRole('');
    setNewTeacherNip('');
    setShowAddForm(false);
  };

  // Compute teacher statistics
  const teacherStats = teachers.map(teacher => {
    const teacherTrainings = trainings.filter(t => t.teacherId === teacher.id || t.teacherName === teacher.name);
    const totalHours = teacherTrainings.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
    const count = teacherTrainings.length;
    const categories = Array.from(new Set(teacherTrainings.map(t => t.category)));

    return {
      ...teacher,
      count,
      totalHours,
      categories,
      lastTraining: teacherTrainings[0]?.startDate || '-',
    };
  });

  const filteredTeacherStats = teacherStats.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E2D9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2C3327]">Analisis Development Guru SD Lazuardi</h2>
          <p className="text-xs text-[#7A756D]">Rekapitulasi total jam pelajaran (JP) dan riwayat partisipasi pelatihan per guru</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center space-x-2 bg-[#1c59c6] hover:bg-[#1547a1] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>{showAddForm ? 'Tutup Form' : 'Tambah Profil Guru Baru'}</span>
        </button>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTeacher} className="bg-[#edf3fc] border border-[#d2e3fc] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c59c6]">Form Pendaftaran Roster Guru Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2C3327] mb-1">Nama Lengkap Guru / Karyawan *</label>
              <input
                type="text"
                placeholder="misal: Aisyu Solihah, S.Pd."
                value={newTeacherName}
                onChange={e => setNewTeacherName(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C3327] mb-1">NIP / ID Guru (Opsional)</label>
              <input
                type="text"
                placeholder="LZU-2026-099"
                value={newTeacherNip}
                onChange={e => setNewTeacherNip(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-[#1c59c6] hover:bg-[#1547a1] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Simpan Profil Guru
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" />
        <input
          type="text"
          placeholder="Cari nama guru / karyawan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E2D9] rounded-xl text-xs text-[#2C3327]"
        />
      </div>

      {/* Teachers Roster List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeacherStats.map(teacher => (
          <div
            key={teacher.id}
            className="bg-white rounded-2xl border border-[#E5E2D9] p-5 shadow-xs flex flex-col justify-between hover:border-[#1c59c6] transition-all"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#2C3327]">{teacher.name}</h3>
                  {teacher.nip && <p className="text-[10px] text-[#7A756D]/70 font-mono mt-0.5">NIP: {teacher.nip}</p>}
                </div>
                <div className="bg-[#edf3fc] text-[#1c59c6] font-bold text-xs px-2.5 py-1 rounded-xl border border-[#d2e3fc]">
                  {teacher.totalHours} JP
                </div>
              </div>

              {/* Progress Summary */}
              <div className="space-y-2 mt-4 pt-3 border-t border-[#F2EFE9] text-xs text-[#7A756D]">
                <div className="flex justify-between">
                  <span>Pelatihan Diikuti:</span>
                  <strong className="text-[#2C3327]">{teacher.count} Kegiatan</strong>
                </div>
                <div className="flex justify-between">
                  <span>Terakhir Mengikuti:</span>
                  <span className="font-mono text-[#7A756D]">{teacher.lastTraining}</span>
                </div>

                {teacher.categories.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-[#7A756D] uppercase tracking-wider block mb-1">
                      Kategori Dikuasai:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {teacher.categories.map(c => (
                        <span key={c} className="bg-[#edf3fc] text-[#1c59c6] text-[10px] px-2 py-0.5 rounded-md font-medium border border-[#d2e3fc]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onFilterByTeacher(teacher.name)}
              className="mt-5 w-full py-2 px-3 bg-[#FAF9F6] hover:bg-[#edf3fc] text-[#2C3327] hover:text-[#1c59c6] rounded-xl text-xs font-semibold border border-[#E5E2D9] hover:border-[#1c59c6] transition-all text-center"
            >
              Lihat Arsip Pelatihan ({teacher.count})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

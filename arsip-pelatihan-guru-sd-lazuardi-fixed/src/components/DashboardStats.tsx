import React from 'react';
import { Award, Users, Clock, BookCheck, TrendingUp, Sparkles, FolderArchive, ArrowRight } from 'lucide-react';
import { TrainingRecord, Teacher, TrainingCategory } from '../types';

interface DashboardStatsProps {
  trainings: TrainingRecord[];
  teachers: Teacher[];
  onNavigateToList: () => void;
  onOpenAddModal: () => void;
  onSelectCategory: (category: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  trainings,
  teachers,
  onNavigateToList,
  onOpenAddModal,
  onSelectCategory,
}) => {
  // Metrics
  const totalTrainings = trainings.length;
  
  const uniqueTeachersCount = new Set(trainings.map(t => t.teacherId || t.teacherName)).size;
  const totalTeachersRoster = Math.max(teachers.length, uniqueTeachersCount);
  
  const totalHours = trainings.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
  
  const certificatesCount = trainings.filter(t => t.certificateUrl || t.certificateDriveUrl).length;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  trainings.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const categoryList: TrainingCategory[] = [
    'Pedagogik',
    'Kurikulum Merdeka',
    'Digital & IT Learning',
    'Inklusi & ABK',
    'Metode Montessori',
    'Pengembangan Karakter & Islam',
    'Leadership & Manajerial',
    'Lainnya',
  ];

  // Top active teachers
  const teacherActivityMap: Record<string, { name: string; role: string; count: number; hours: number }> = {};
  trainings.forEach(t => {
    const key = t.teacherName;
    if (!teacherActivityMap[key]) {
      teacherActivityMap[key] = { name: t.teacherName, role: t.teacherRole, count: 0, hours: 0 };
    }
    teacherActivityMap[key].count += 1;
    teacherActivityMap[key].hours += Number(t.hours) || 0;
  });

  const sortedActiveTeachers = Object.values(teacherActivityMap)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 4);

  // Recent 3 trainings
  const recentTrainings = [...trainings]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E2D9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756D]">Total Pelatihan</p>
            <h3 className="text-2xl font-bold text-[#2C3327] mt-1">{totalTrainings} <span className="text-xs font-normal text-[#7A756D]">kegiatan</span></h3>
            <p className="text-xs text-[#1c59c6] font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Terarsip sistematis
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#edf3fc] text-[#1c59c6] flex items-center justify-center border border-[#d2e3fc]">
            <BookCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E2D9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756D]">Guru Berpartisipasi</p>
            <h3 className="text-2xl font-bold text-[#2C3327] mt-1">{uniqueTeachersCount} <span className="text-xs font-normal text-[#7A756D]">/ {totalTeachersRoster} guru</span></h3>
            <p className="text-xs text-[#1547a1] font-medium mt-1">
              {Math.round((uniqueTeachersCount / (totalTeachersRoster || 1)) * 100)}% partisipasi aktif
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#edf3fc] text-[#1547a1] flex items-center justify-center border border-[#d2e3fc]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E2D9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756D]">Total Akumulasi JP</p>
            <h3 className="text-2xl font-bold text-[#2C3327] mt-1">{totalHours} <span className="text-xs font-normal text-[#7A756D]">Jam Pelajaran</span></h3>
            <p className="text-xs text-[#B8860B] font-medium mt-1">
              Rata-rata {totalTrainings > 0 ? (totalHours / totalTrainings).toFixed(1) : 0} JP / kegiatan
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FDF8EC] text-[#B8860B] flex items-center justify-center border border-[#F3E7C4]">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E2D9] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756D]">Sertifikat Drive</p>
            <h3 className="text-2xl font-bold text-[#2C3327] mt-1">{certificatesCount} <span className="text-xs font-normal text-[#7A756D]">berkas</span></h3>
            <p className="text-xs text-[#1c59c6] font-medium mt-1 flex items-center gap-1">
              <FolderArchive className="w-3.5 h-3.5" /> Terhubung Google Drive
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#edf3fc] text-[#1c59c6] flex items-center justify-center border border-[#d2e3fc]">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Split: Categories Breakdown & Top Teacher Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E2D9] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#2C3327]">Distribusi Kategori Pelatihan</h3>
              <p className="text-xs text-[#7A756D]">Fokus pengembangan kompetensi SD Lazuardi</p>
            </div>
            <button
              onClick={onNavigateToList}
              className="text-xs font-semibold text-[#1c59c6] hover:text-[#1547a1] flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            {categoryList.map(cat => {
              const count = categoryCounts[cat] || 0;
              const percentage = totalTrainings > 0 ? Math.round((count / totalTrainings) * 100) : 0;
              return (
                <div
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className="p-3.5 rounded-xl border border-[#E5E2D9] bg-[#FAF9F6] hover:bg-[#edf3fc] hover:border-[#1c59c6] cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-[#2C3327]">{cat}</span>
                    <span className="text-xs font-bold text-[#2C3327] bg-white px-2 py-0.5 rounded-md border border-[#D9D5CB]">
                      {count} <span className="text-[10px] text-[#7A756D] font-normal">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E2D9] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1c59c6] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Participating Teachers Leaderboard */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E2D9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-[#F3E7C4] text-[#B8860B] rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2C3327]">Guru Teraktif</h3>
                <p className="text-xs text-[#7A756D]">Poin jam pengembangan terbanyak</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {sortedActiveTeachers.map((t, index) => (
                <div key={t.name} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E2D9]">
                  <div className="flex items-center space-x-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      index === 0 ? 'bg-[#D4A359] text-white' : index === 1 ? 'bg-[#C0C7B9] text-[#2C3327]' : 'bg-[#E0D7C6] text-[#2C3327]'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#2C3327]">{t.name}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#1c59c6] block">{t.hours} JP</span>
                    <span className="text-[10px] text-[#7A756D]">{t.count} kegiatan</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenAddModal}
            className="w-full mt-6 py-2.5 px-4 bg-[#1c59c6] hover:bg-[#1547a1] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 shadow-xs"
          >
            <span>+ Input Pelatihan Baru</span>
          </button>
        </div>
      </div>

      {/* Recent Training Feed */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E2D9] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#2C3327]">Pelatihan Terbaru SD Lazuardi</h3>
            <p className="text-xs text-[#7A756D]">Catatan pelatihan terkini yang sudah diunggah</p>
          </div>
          <button
            onClick={onNavigateToList}
            className="text-xs font-semibold text-[#1c59c6] hover:text-[#1547a1] flex items-center gap-1"
          >
            Buka Katalog Lengkap <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentTrainings.map(item => (
            <div key={item.id} className="p-4 rounded-xl border border-[#E5E2D9] bg-[#FAF9F6] flex flex-col justify-between hover:border-[#1c59c6] transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-[#edf3fc] text-[#1c59c6] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#d2e3fc]">
                    {item.category}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7A756D]">{item.hours} JP</span>
                </div>
                <h4 className="text-xs font-bold text-[#2C3327] line-clamp-2">{item.trainingName}</h4>
                <p className="text-xs font-medium text-[#1c59c6] mt-1">{item.teacherName}</p>
                <p className="text-[11px] text-[#7A756D] mt-0.5">{item.organizer}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E2D9] flex items-center justify-between text-[11px] text-[#7A756D]">
                <span>{item.startDate}</span>
                <span className="text-[#1c59c6] font-semibold">Tersimpan</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

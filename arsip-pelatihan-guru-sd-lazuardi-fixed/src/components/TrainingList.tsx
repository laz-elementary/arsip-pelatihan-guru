import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, Award, BookOpen, ExternalLink, 
  Trash2, Edit3, Eye, FileText, CheckCircle2, UserCheck, 
  FolderCheck, Sparkles, MapPin, Wifi
} from 'lucide-react';
import { TrainingRecord, FilterOptions, DRIVE_FOLDERS } from '../types';

interface TrainingListProps {
  trainings: TrainingRecord[];
  onSelectRecord: (record: TrainingRecord) => void;
  onEditRecord: (record: TrainingRecord) => void;
  onDeleteRecord: (id: string) => void;
  selectedCategoryFromDash?: string;
  onResetCategoryFilter?: () => void;
}

export const TrainingList: React.FC<TrainingListProps> = ({
  trainings,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  selectedCategoryFromDash,
  onResetCategoryFilter,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    category: selectedCategoryFromDash || 'Semua',
    teacherName: 'Semua',
    year: 'Semua',
    sortBy: 'dateDesc',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const getLocationInfo = (storedLocation?: string) => {
    const raw = (storedLocation || '').trim();
    const onlinePrefix = /^(online)(?:\s*[-–—:]\s*)?/i;
    const offlinePrefix = /^(offline)(?:\s*[-–—:]\s*)?/i;
    const isOnline = onlinePrefix.test(raw)
      || (!offlinePrefix.test(raw) && /(zoom|google\s*meet|microsoft\s*teams|webinar|daring|online)/i.test(raw));

    return {
      isOnline,
      detail: raw.replace(/^(online|offline)(?:\s*[-–—:]\s*)?/i, '').trim(),
    };
  };

  // Sync prop if changed from dashboard
  React.useEffect(() => {
    if (selectedCategoryFromDash) {
      setFilters(prev => ({ ...prev, category: selectedCategoryFromDash }));
    }
  }, [selectedCategoryFromDash]);

  // Unique teacher names
  const teacherNames = Array.from(new Set(trainings.map(t => t.teacherName)));

  // Filter logic
  const filteredTrainings = (trainings || []).filter(item => {
    if (!item) return false;
    const searchLower = (filters.searchQuery || '').toLowerCase();
    const tName = item.trainingName || '';
    const tcName = item.teacherName || '';
    const org = item.organizer || '';
    const note = item.notes || '';
    const location = item.location || '';

    const matchesSearch = 
      tName.toLowerCase().includes(searchLower) ||
      tcName.toLowerCase().includes(searchLower) ||
      org.toLowerCase().includes(searchLower) ||
      location.toLowerCase().includes(searchLower) ||
      note.toLowerCase().includes(searchLower);

    const matchesCategory = filters.category === 'Semua' || item.category === filters.category;
    const matchesTeacher = filters.teacherName === 'Semua' || item.teacherName === filters.teacherName;
    
    const yearStr = item.startDate ? item.startDate.split('-')[0] : '';
    const matchesYear = filters.year === 'Semua' || yearStr === filters.year;

    return matchesSearch && matchesCategory && matchesTeacher && matchesYear;
  });

  // Sorting
  const sortedTrainings = [...filteredTrainings].sort((a, b) => {
    if (filters.sortBy === 'dateDesc') {
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      return db - da;
    }
    if (filters.sortBy === 'dateAsc') {
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      return da - db;
    }
    if (filters.sortBy === 'teacherName') {
      return (a.teacherName || '').localeCompare(b.teacherName || '');
    }
    if (filters.sortBy === 'hoursDesc') {
      return (b.hours || 0) - (a.hours || 0);
    }
    return 0;
  });

  const standardCategories = [
    'Semua',
    'Pedagogik',
    'Kurikulum Merdeka',
    'Digital & IT Learning',
    'Inklusi & ABK',
    'Metode Montessori',
    'Pengembangan Karakter & Islam',
    'Leadership & Manajerial',
  ];
  const customCats = trainings.map(t => t.category).filter(c => Boolean(c) && !standardCategories.includes(c));
  const categories = Array.from(new Set([...standardCategories, ...customCats, 'Lain-lain']));

  return (
    <div className="space-y-5">
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#E5E2D9] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" />
            <input
              type="text"
              placeholder="Cari nama guru, judul pelatihan, penyelenggara, atau kata kunci..."
              value={filters.searchQuery}
              onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs md:text-sm text-[#2C3327] placeholder-[#7A756D] focus:outline-hidden focus:ring-2 focus:ring-[#1c59c6] focus:bg-white transition-all"
            />
          </div>

          {/* Teacher & Sort Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.teacherName}
              onChange={e => setFilters({ ...filters, teacherName: e.target.value })}
              className="px-3 py-2 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs font-semibold text-[#3D4C36] focus:outline-hidden focus:ring-2 focus:ring-[#1c59c6]"
            >
              <option value="Semua">Semua Guru ({teacherNames.length})</option>
              {teacherNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-3 py-2 bg-[#FAF9F6] border border-[#E5E2D9] rounded-xl text-xs font-semibold text-[#3D4C36] focus:outline-hidden focus:ring-2 focus:ring-[#1c59c6]"
            >
              <option value="dateDesc">Urut: Terbaru</option>
              <option value="dateAsc">Urut: Terlama</option>
              <option value="hoursDesc">Urut: Jam JP Terbanyak</option>
              <option value="teacherName">Urut: Nama Guru</option>
            </select>

            {/* View Mode Switcher */}
            <div className="bg-[#F2EFE9] p-1 rounded-xl flex items-center space-x-1 border border-[#E5E2D9]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-[#1c59c6] text-white shadow-xs' : 'text-[#3D4C36]'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${viewMode === 'table' ? 'bg-[#1c59c6] text-white shadow-xs' : 'text-[#3D4C36]'}`}
              >
                Tabel
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[#7A756D] font-semibold text-xs shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#1c59c6]" /> Kategori:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setFilters({ ...filters, category: cat });
                if (onResetCategoryFilter && cat === 'Semua') onResetCategoryFilter();
              }}
              className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
                filters.category === cat
                  ? 'bg-[#1c59c6] text-white shadow-xs'
                  : 'bg-[#F2EFE9] text-[#3D4C36] hover:bg-[#E0D7C6]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex justify-between items-center text-xs text-[#7A756D] px-1">
        <span>Menampilkan <strong className="text-[#2C3327]">{sortedTrainings.length}</strong> data pelatihan</span>
        {filters.category !== 'Semua' && (
          <button 
            onClick={() => setFilters({ ...filters, category: 'Semua' })}
            className="text-[#1c59c6] hover:underline font-semibold"
          >
            Reset filter kategori ({filters.category})
          </button>
        )}
      </div>

      {/* Grid Mode View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedTrainings.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5E2D9] p-5 flex flex-col justify-between hover:shadow-md hover:border-[#1c59c6] transition-all group"
            >
              <div>
                {/* Category & Hours Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-[#edf3fc] text-[#1c59c6] border border-[#d2e3fc] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <span className="bg-[#FAF9F6] text-[#3D4C36] border border-[#E5E2D9] text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#D4A359]" /> {item.hours} JP
                  </span>
                </div>

                {/* Training Name */}
                <h3 
                  onClick={() => onSelectRecord(item)}
                  className="text-sm font-bold text-[#2C3327] group-hover:text-[#1c59c6] cursor-pointer line-clamp-2 transition-colors"
                >
                  {item.trainingName}
                </h3>

                {/* Teacher Details */}
                <div className="mt-3 pt-3 border-t border-[#E5E2D9] flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#edf3fc] text-[#1c59c6] flex items-center justify-center font-bold text-xs shrink-0 border border-[#d2e3fc]">
                    {item.teacherName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2C3327]">{item.teacherName}</h4>
                  </div>
                </div>

                {/* Training Info */}
                <div className="mt-3 space-y-1.5 text-xs text-[#7A756D]">
                  <p className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#1c59c6]" />
                    <span className="truncate">{item.organizer}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#1c59c6]" />
                    <span>{item.startDate} {item.endDate && item.endDate !== item.startDate ? `s/d ${item.endDate}` : ''}</span>
                  </p>
                  {(() => {
                    const locationInfo = getLocationInfo(item.location);
                    return (
                      <p className="flex items-center gap-1.5">
                        {locationInfo.isOnline ? (
                          <Wifi className="w-3.5 h-3.5 text-[#1c59c6]" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                        )}
                        <span className="truncate">
                          {locationInfo.isOnline ? 'Online' : 'Offline'}
                          {locationInfo.detail ? ` - ${locationInfo.detail}` : ''}
                        </span>
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Drive Links & Actions */}
              <div className="mt-4 pt-3 border-t border-[#E5E2D9] flex flex-col space-y-2">
                {/* Certificate & Material Links */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <a
                    href={item.certificateDriveUrl || DRIVE_FOLDERS.CERTIFICATES}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-[#F2EFE9] hover:bg-[#edf3fc] text-[#2C3327] rounded-lg font-semibold transition-colors border border-[#E5E2D9]"
                    title="Buka Sertifikat di Google Drive"
                  >
                    <FolderCheck className="w-3.5 h-3.5 text-[#1c59c6]" />
                    <span>Sertifikat Drive</span>
                  </a>

                  {item.materialDriveUrl ? (
                    <a
                      href={item.materialDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-[#FAF9F6] hover:bg-[#edf3fc] text-[#2C3327] rounded-lg font-semibold transition-colors border border-[#E5E2D9]"
                      title="Buka bahan materi"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#1c59c6]" />
                      <span>Bahan Materi</span>
                    </a>
                  ) : (
                    <span className="flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-[#F2EFE9] text-[#AAA49A] rounded-lg font-semibold border border-[#E5E2D9]" title="Belum ada bahan materi">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Belum Ada Materi</span>
                    </span>
                  )}
                </div>

                {/* Main Modal Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onSelectRecord(item)}
                    className="flex-1 py-1.5 px-3 bg-[#1c59c6] hover:bg-[#1547a1] text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Detail</span>
                  </button>

                  <div className="flex items-center ml-2 space-x-1">
                    <button
                      onClick={() => onEditRecord(item)}
                      className="p-1.5 text-[#7A756D] hover:text-[#1c59c6] hover:bg-[#F2EFE9] rounded-md"
                      title="Edit Data"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus arsip pelatihan "${item.trainingName}"?`)) {
                          onDeleteRecord(item.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Hapus Data"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table Mode View */
        <div className="bg-white rounded-2xl border border-[#E5E2D9] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2C3327]">
              <thead className="bg-[#F2EFE9] border-b border-[#E5E2D9] text-[#7A756D] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nama Guru</th>
                  <th className="py-3 px-4">Judul Pelatihan</th>
                  <th className="py-3 px-4">Penyelenggara</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Metode & Lokasi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">JP</th>
                  <th className="py-3 px-4 text-center">Drive Links</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D9]">
                {sortedTrainings.map(item => (
                  <tr key={item.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2C3327]">{item.teacherName}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div 
                        onClick={() => onSelectRecord(item)}
                        className="font-semibold text-[#2C3327] hover:text-[#1c59c6] cursor-pointer line-clamp-2"
                      >
                        {item.trainingName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#7A756D]">{item.organizer}</td>
                    <td className="py-3 px-4 font-mono text-[#7A756D]">{item.startDate}</td>
                    <td className="py-3 px-4">
                      {(() => {
                        const locationInfo = getLocationInfo(item.location);
                        return (
                          <div className="flex items-center gap-1.5 text-[#7A756D]">
                            {locationInfo.isOnline ? (
                              <Wifi className="w-3.5 h-3.5 text-[#1c59c6]" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                            )}
                            <span>
                              {locationInfo.isOnline ? 'Online' : 'Offline'}
                              {locationInfo.detail ? ` - ${locationInfo.detail}` : ''}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-[#edf3fc] text-[#1c59c6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#d2e3fc]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2C3327]">{item.hours} JP</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-1.5">
                        <a
                          href={item.certificateDriveUrl || DRIVE_FOLDERS.CERTIFICATES}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#F2EFE9] text-[#2C3327] hover:bg-[#edf3fc] rounded-md text-[10px] font-semibold flex items-center gap-1 border border-[#E5E2D9]"
                          title="Sertifikat Drive"
                        >
                          <FolderCheck className="w-3.5 h-3.5 text-[#1c59c6]" /> Sertifikat
                        </a>
                        {item.materialDriveUrl ? (
                          <a
                            href={item.materialDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-[#FAF9F6] text-[#2C3327] hover:bg-[#edf3fc] rounded-md text-[10px] font-semibold flex items-center gap-1 border border-[#E5E2D9]"
                            title="Buka bahan materi"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-[#1c59c6]" /> Materi
                          </a>
                        ) : (
                          <span className="p-1.5 bg-[#F2EFE9] text-[#AAA49A] rounded-md text-[10px] font-semibold flex items-center gap-1 border border-[#E5E2D9]" title="Belum ada bahan materi">
                            <BookOpen className="w-3.5 h-3.5" /> Tidak Ada
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onSelectRecord(item)}
                          className="p-1.5 text-[#1c59c6] hover:bg-[#edf3fc] rounded-md font-semibold text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                        <button
                          onClick={() => onEditRecord(item)}
                          className="p-1.5 text-[#7A756D] hover:text-[#1c59c6] hover:bg-[#F2EFE9] rounded-md"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus arsip pelatihan "${item.trainingName}"?`)) {
                              onDeleteRecord(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedTrainings.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E2D9] shadow-xs">
          <FileText className="w-12 h-12 text-[#C0C7B9] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2C3327]">Tidak ada data pelatihan ditemukan</h3>
          <p className="text-xs text-[#7A756D] max-w-sm mx-auto mt-1">
            Coba ubah kata kunci pencarian atau reset filter kategori yang aktif.
          </p>
        </div>
      )}
    </div>
  );
};

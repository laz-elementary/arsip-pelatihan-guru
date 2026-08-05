import React from 'react';
import { Award, PlusCircle, LayoutDashboard, ListFilter, Download, FolderOpen, BookOpen, Server } from 'lucide-react';
import { DRIVE_FOLDERS } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'list' | 'analytics' | 'integration';
  setActiveTab: (tab: 'dashboard' | 'list' | 'analytics' | 'integration') => void;
  onOpenAddModal: () => void;
  onExportExcel: () => void;
  totalRecords: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onExportExcel,
  totalRecords,
}) => {
  return (
    <header id="main-header" className="bg-[#FAF9F6] border-b border-[#E5E2D9] sticky top-0 z-30 shadow-xs">
      {/* Top School Bar */}
      <div className="bg-[#0f2857] text-[#D9D5CB] text-xs py-1.5 px-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-[#93c5fd]">SD Lazuardi Global Compassionate School</span>
          <span className="hidden md:inline text-[#3b5998]">•</span>
          <span className="hidden md:inline text-[#c0d4ff]">Sistem Arsip Pelatihan & Pengembangan Profesi Guru</span>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href={DRIVE_FOLDERS.CERTIFICATES}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#93c5fd] transition-colors flex items-center space-x-1"
            title="Buka Drive Sertifikat"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#93c5fd]" />
            <span className="hidden sm:inline">Drive Sertifikat</span>
          </a>
          <a
            href={DRIVE_FOLDERS.MATERIALS}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#93c5fd] transition-colors flex items-center space-x-1"
            title="Buka Drive Materi"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="hidden sm:inline">Drive Materi</span>
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-[#1c59c6] flex items-center justify-center text-white shadow-sm font-bold text-xl tracking-wider">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1e293b] leading-tight">
                Arsip Pelatihan Guru
              </h1>
              <p className="text-xs text-[#64748b] font-medium">SD Lazuardi</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#F2EFE9] p-1 rounded-xl border border-[#E5E2D9]">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#1c59c6] text-white shadow-xs'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#EAE6DD]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Rekap</span>
            </button>

            <button
              id="tab-list"
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-[#1c59c6] text-white shadow-xs'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#EAE6DD]'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Daftar Pelatihan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'list' ? 'bg-[#1547a1] text-white' : 'bg-[#E0D7C6] text-[#2C3327]'
              }`}>
                {totalRecords}
              </span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#1c59c6] text-white shadow-xs'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#EAE6DD]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Analisis Guru</span>
            </button>

            <button
              id="tab-integration"
              onClick={() => setActiveTab('integration')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'integration'
                  ? 'bg-[#1c59c6] text-white shadow-xs'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#EAE6DD]'
              }`}
            >
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Status Integrasi</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-export-excel"
              onClick={onExportExcel}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-[#D9D5CB] text-xs font-semibold text-[#1e293b] bg-white hover:bg-[#F2EFE9] transition-colors shadow-xs"
              title="Unduh Rekap Laporan Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-[#1c59c6]" />
              <span>Export Excel</span>
            </button>

            <button
              id="btn-add-training"
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-2 bg-[#1c59c6] hover:bg-[#1547a1] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Pelatihan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="md:hidden flex border-t border-[#E5E2D9] bg-[#F2EFE9] px-2 py-1 justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md ${
            activeTab === 'dashboard' ? 'bg-[#1c59c6] text-white' : 'text-[#334155]'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md ${
            activeTab === 'list' ? 'bg-[#1c59c6] text-white' : 'text-[#334155]'
          }`}
        >
          Daftar ({totalRecords})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md ${
            activeTab === 'analytics' ? 'bg-[#1c59c6] text-white' : 'text-[#334155]'
          }`}
        >
          Analisis
        </button>
        <button
          onClick={() => setActiveTab('integration')}
          className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md ${
            activeTab === 'integration' ? 'bg-[#1c59c6] text-white' : 'text-[#334155]'
          }`}
        >
          Integrasi
        </button>
      </div>
    </header>
  );
};

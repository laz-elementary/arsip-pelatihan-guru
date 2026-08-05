import React from 'react';
import { ExternalLink, FolderCheck, FileText, Info } from 'lucide-react';
import { DRIVE_FOLDERS } from '../types';

export const DriveFolderBanner: React.FC = () => {
  return (
    <div id="drive-banner" className="bg-[#1c59c6] text-white rounded-2xl p-5 md:p-6 shadow-sm border border-[#1547a1] mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-[#1547a1] rounded-xl text-[#d2e3fc] shrink-0 mt-0.5">
            <FolderCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#1547a1] text-[#e8f0fe] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#3b82f6]">
                Google Drive Synchronization
              </span>
              <span className="text-[#bfdbfe] text-xs flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#93c5fd]" /> Real-time Akses Manajemen Sekolah
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Folder Penyimpanan Drive SD Lazuardi
            </h3>
            <p className="text-[#e8f0fe] text-sm mt-0.5 max-w-2xl">
              Seluruh sertifikat dan bahan materi pelatihan tersimpan secara terstruktur di folder Google Drive resmi sekolah agar dapat diakses manajemen secara real-time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <a
            id="btn-drive-cert"
            href={DRIVE_FOLDERS.CERTIFICATES}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-white text-[#1e293b] hover:bg-[#F2EFE9] font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs border border-[#E5E2D9]"
          >
            <FolderCheck className="w-4 h-4 text-[#1c59c6]" />
            <span>Folder Sertifikat</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#7A756D]" />
          </a>

          <a
            id="btn-drive-mat"
            href={DRIVE_FOLDERS.MATERIALS}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-[#1547a1] hover:bg-[#0f2857] text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs border border-[#3b82f6]"
          >
            <FileText className="w-4 h-4 text-[#bfdbfe]" />
            <span>Folder Bahan Materi</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};

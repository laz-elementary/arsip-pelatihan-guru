import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, FolderCheck, BookOpen, 
  CheckCircle2, AlertCircle, Loader2, CloudUpload, FileCheck, RefreshCw
} from 'lucide-react';
import { TrainingRecord, Teacher } from '../types';
import { 
  uploadFileToDriveOnly, 
  saveFileMetadataToSupabase, 
  UploadStage 
} from '../lib/driveUploader';

interface TrainingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<TrainingRecord, 'id' | 'createdAt'> & { id?: string }) => void | Promise<void>;
  initialData?: TrainingRecord | null;
  teachers: Teacher[];
  onAddTeacher?: (teacher: Teacher) => void;
}

export const TrainingFormModal: React.FC<TrainingFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  teachers,
  onAddTeacher,
}) => {
  const [recordId, setRecordId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherRole, setTeacherRole] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState<number>(16);
  const [category, setCategory] = useState<string>('Pedagogik');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [location, setLocation] = useState('SD Lazuardi');
  const [notes, setNotes] = useState('');

  // Certificate Upload State Machine
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certUploadId, setCertUploadId] = useState<string>('');
  const [certStage, setCertStage] = useState<UploadStage>('idle');
  const [certProgress, setCertProgress] = useState<number>(0);
  const [certFileId, setCertFileId] = useState<string>('');
  const [certWebViewLink, setCertWebViewLink] = useState<string>('');
  const [certFileName, setCertFileName] = useState<string>('');
  const [certMimeType, setCertMimeType] = useState<string>('');
  const [certFileSize, setCertFileSize] = useState<number>(0);
  const [certErrorMessage, setCertErrorMessage] = useState<string>('');
  const [certificateDriveUrl, setCertificateDriveUrl] = useState('');
  const [certificateFileName, setCertificateFileName] = useState('');

  // Material Upload State Machine
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matUploadId, setMatUploadId] = useState<string>('');
  const [matStage, setMatStage] = useState<UploadStage>('idle');
  const [matProgress, setMatProgress] = useState<number>(0);
  const [matFileId, setMatFileId] = useState<string>('');
  const [matWebViewLink, setMatWebViewLink] = useState<string>('');
  const [matFileName, setMatFileName] = useState<string>('');
  const [matMimeType, setMatMimeType] = useState<string>('');
  const [matFileSize, setMatFileSize] = useState<number>(0);
  const [matErrorMessage, setMatErrorMessage] = useState<string>('');
  const [materialDriveUrl, setMaterialDriveUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');

  // New Teacher Inline Toggle
  const [isAddingNewTeacher, setIsAddingNewTeacher] = useState(false);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [isSavingArchive, setIsSavingArchive] = useState(false);
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; details?: any } | null>(null);

  const standardCategories = [
    'Pedagogik',
    'Kurikulum Merdeka',
    'Digital & IT Learning',
    'Inklusi & ABK',
    'Metode Montessori',
    'Pengembangan Karakter & Islam',
    'Leadership & Manajerial',
  ];


  const sanitizeFileNamePart = (value: string) =>
    value
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/-+/g, '-')
      .replace(/^[.\s-]+|[.\s-]+$/g, '')
      .slice(0, 90);

  const getFileExtension = (fileName: string) => {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.slice(lastDot).toLowerCase() : '';
  };

  const buildDriveFileName = (file: File, fileType: 'certificate' | 'material') => {
    const participantName = sanitizeFileNamePart(teacherName) || 'Tanpa Nama';
    const title = sanitizeFileNamePart(trainingName) || 'Pelatihan';
    const label = fileType === 'certificate' ? 'Sertifikat' : 'Bahan Materi';
    const extension = getFileExtension(file.name);
    return `${participantName} - ${title} - ${label}${extension}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    // Check server upload configuration status
    fetch('/api/drive/config-status')
      .then(res => res.json())
      .then(data => setConfigStatus(data))
      .catch(() => setConfigStatus(null));

    setIsSavingArchive(false);
    setIsTeacherDropdownOpen(false);

    // Reset certificate upload state
    setCertFile(null);
    setCertUploadId('');
    setCertStage('idle');
    setCertProgress(0);
    setCertFileId('');
    setCertWebViewLink('');
    setCertFileName('');
    setCertMimeType('');
    setCertFileSize(0);
    setCertErrorMessage('');

    // Reset material upload state
    setMatFile(null);
    setMatUploadId('');
    setMatStage('idle');
    setMatProgress(0);
    setMatFileId('');
    setMatWebViewLink('');
    setMatFileName('');
    setMatMimeType('');
    setMatFileSize(0);
    setMatErrorMessage('');

    setRecordId(initialData?.id || `tr-${crypto.randomUUID()}`);

    if (initialData) {
      setTeacherId(initialData.teacherId || '');
      setTeacherName(initialData.teacherName || '');
      setTeacherRole(initialData.teacherRole || 'Guru SD Lazuardi');
      setTrainingName(initialData.trainingName || '');
      setOrganizer(initialData.organizer || '');
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(initialData.endDate || initialData.startDate || new Date().toISOString().split('T')[0]);
      setHours(initialData.hours || 16);
      
      const catVal = initialData.category || 'Pedagogik';
      if (standardCategories.includes(catVal)) {
        setCategory(catVal);
        setCustomCategory('');
      } else {
        setCategory('Lain-lain');
        setCustomCategory(catVal);
      }

      setLocation(initialData.location || 'SD Lazuardi');
      setNotes(initialData.notes || '');
      
      setCertificateDriveUrl(initialData.certificateDriveUrl || '');
      setCertificateFileName(initialData.certificateFileName || '');

      setMaterialDriveUrl(initialData.materialDriveUrl || '');
      setMaterialFileName(initialData.materialFileName || '');
      setIsAddingNewTeacher(false);
    } else {
      setTeacherId('');
      setTeacherName('');
      setTeacherRole('');
      setTrainingName('');
      setOrganizer('Yayasan Lazuardi Hayati');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
      setHours(16);
      setCategory('Pedagogik');
      setCustomCategory('');
      setLocation('SD Lazuardi');
      setNotes('');
      setCertificateDriveUrl('');
      setCertificateFileName('');
      setMaterialDriveUrl('');
      setMaterialFileName('');
      setIsAddingNewTeacher(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTeacherNameChange = (value: string) => {
    setTeacherName(value);
    setIsTeacherDropdownOpen(Boolean(value.trim()));

    const exactMatch = (teachers || []).find(
      teacher => teacher?.name?.toLowerCase() === value.trim().toLowerCase()
    );

    if (exactMatch) {
      setTeacherId(exactMatch.id);
      setTeacherRole(exactMatch.role || '');
      setIsAddingNewTeacher(false);
    } else {
      setTeacherId('new');
      setTeacherRole('');
      setIsAddingNewTeacher(Boolean(value.trim()));
    }
  };

  const selectTeacher = (teacher: Teacher) => {
    setTeacherId(teacher.id);
    setTeacherName(teacher.name);
    setTeacherRole(teacher.role || '');
    setIsAddingNewTeacher(false);
    setIsTeacherDropdownOpen(false);
  };

  const filteredTeachers = teacherName.trim()
    ? (teachers || [])
        .filter(teacher =>
          teacher?.name?.toLowerCase().includes(teacherName.trim().toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 12)
    : [];

  // --- CERTIFICATE UPLOAD FLOW ---
  const handleFileChangeCert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUploadId = crypto.randomUUID();
      setCertFile(file);
      setCertUploadId(newUploadId);
      setCertStage('idle');
      setCertProgress(0);
      setCertFileId('');
      setCertWebViewLink('');
      setCertFileName(file.name);
      setCertMimeType(file.type || 'application/octet-stream');
      setCertFileSize(file.size);
      setCertErrorMessage('');

      // Pre-validate file rules
      const ext = ('.' + file.name.split('.').pop()).toLowerCase();
      const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
      if (file.size > 10 * 1024 * 1024) {
        setCertErrorMessage(`Ukuran file sertifikat melebihi batas 10 MB (Ukuran file: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        setCertStage('upload_failed');
      } else if (!allowed.includes(ext)) {
        setCertErrorMessage(`Format file sertifikat (${ext}) tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.`);
        setCertStage('upload_failed');
      }
    }
  };

  const doSaveCertMetadata = async (targetFileId?: string, targetWebViewLink?: string, targetFileName?: string) => {
    const activeFileId = targetFileId || certFileId;
    const activeWebViewLink = targetWebViewLink || certWebViewLink || certificateDriveUrl;
    const activeFileName = targetFileName || certFileName || (certFile ? buildDriveFileName(certFile, 'certificate') : 'Sertifikat.pdf');

    if (!activeFileId) {
      setCertErrorMessage('ID file sertifikat belum tersedia di Google Drive.');
      setCertStage('upload_failed');
      return;
    }

    setCertStage('saving_metadata');
    setCertErrorMessage('');

    try {
      const metaRes = await saveFileMetadataToSupabase({
        fileId: activeFileId,
        fileName: activeFileName,
        mimeType: certMimeType || certFile?.type || 'application/pdf',
        fileSize: certFileSize || certFile?.size || 0,
        fileType: 'certificate',
        uploadId: certUploadId,
        trainingId: recordId,
      });

      if (metaRes.ok && metaRes.metadataSaved) {
        setCertStage('completed');
        if (metaRes.webViewLink) {
          setCertWebViewLink(metaRes.webViewLink);
          setCertificateDriveUrl(metaRes.webViewLink);
        }
      } else {
        setCertStage('metadata_failed');
        setCertErrorMessage(metaRes.message || 'File sudah tersimpan di Google Drive, tetapi pencatatan ke database belum berhasil');
      }
    } catch (err: any) {
      setCertStage('metadata_failed');
      setCertErrorMessage('File sudah tersimpan di Google Drive, tetapi pencatatan ke database belum berhasil');
    }
  };

  const executeCertUpload = async (): Promise<string> => {
    if (!certFile) {
      return certificateDriveUrl;
    }

    // If metadata save failed previously but file is already in Drive
    if (certStage === 'metadata_failed' && certFileId) {
      await doSaveCertMetadata(certFileId, certWebViewLink);
      return certWebViewLink || certificateDriveUrl;
    }

    // If already fully completed or uploaded
    if ((certStage === 'drive_uploaded' || certStage === 'completed') && certFileId) {
      return certWebViewLink || certificateDriveUrl;
    }

    if (!teacherName.trim() || !trainingName.trim()) {
      const message = 'Isi Nama Guru/Pegawai dan Nama Pelatihan terlebih dahulu agar nama file sertifikat dapat dibuat otomatis.';
      setCertErrorMessage(message);
      setCertStage('upload_failed');
      throw new Error(message);
    }

    const targetFileName = buildDriveFileName(certFile, 'certificate');
    setCertFileName(targetFileName);
    setCertificateFileName(targetFileName);
    setCertStage('uploading_drive');
    setCertProgress(0);
    setCertErrorMessage('');

    try {
      // Step 1: Upload to Google Drive (or retrieve existing)
      const driveRes = await uploadFileToDriveOnly(
        certFile,
        'certificate',
        certUploadId,
        (percent) => setCertProgress(percent),
        targetFileName
      );

      setCertFileId(driveRes.fileId);
      setCertWebViewLink(driveRes.webViewLink);
      setCertificateDriveUrl(driveRes.webViewLink);
      setCertificateFileName(targetFileName);
      setCertStage('drive_uploaded');

      // Step 2: Save metadata to Supabase
      await doSaveCertMetadata(driveRes.fileId, driveRes.webViewLink, targetFileName);
      return driveRes.webViewLink;
    } catch (error: any) {
      setCertStage('upload_failed');
      setCertErrorMessage(error.message || 'Gagal mengunggah Sertifikat ke Google Drive.');
      throw error;
    }
  };

  // --- MATERIAL UPLOAD FLOW ---
  const handleFileChangeMat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUploadId = crypto.randomUUID();
      setMatFile(file);
      setMatUploadId(newUploadId);
      setMatStage('idle');
      setMatProgress(0);
      setMatFileId('');
      setMatWebViewLink('');
      setMatFileName(file.name);
      setMatMimeType(file.type || 'application/octet-stream');
      setMatFileSize(file.size);
      setMatErrorMessage('');

      // Pre-validate file rules
      const ext = ('.' + file.name.split('.').pop()).toLowerCase();
      const allowed = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
      if (file.size > 50 * 1024 * 1024) {
        setMatErrorMessage(`Ukuran file materi melebihi batas 50 MB (Ukuran file: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        setMatStage('upload_failed');
      } else if (!allowed.includes(ext)) {
        setMatErrorMessage(`Format file materi (${ext}) tidak didukung. Gunakan PDF, PPT, PPTX, DOC, DOCX, XLS, atau XLSX.`);
        setMatStage('upload_failed');
      }
    }
  };

  const doSaveMatMetadata = async (targetFileId?: string, targetWebViewLink?: string, targetFileName?: string) => {
    const activeFileId = targetFileId || matFileId;
    const activeWebViewLink = targetWebViewLink || matWebViewLink || materialDriveUrl;
    const activeFileName = targetFileName || matFileName || (matFile ? buildDriveFileName(matFile, 'material') : 'Bahan_Materi.pdf');

    if (!activeFileId) {
      setMatErrorMessage('ID file materi belum tersedia di Google Drive.');
      setMatStage('upload_failed');
      return;
    }

    setMatStage('saving_metadata');
    setMatErrorMessage('');

    try {
      const metaRes = await saveFileMetadataToSupabase({
        fileId: activeFileId,
        fileName: activeFileName,
        mimeType: matMimeType || matFile?.type || 'application/pdf',
        fileSize: matFileSize || matFile?.size || 0,
        fileType: 'material',
        uploadId: matUploadId,
        trainingId: recordId,
      });

      if (metaRes.ok && metaRes.metadataSaved) {
        setMatStage('completed');
        if (metaRes.webViewLink) {
          setMatWebViewLink(metaRes.webViewLink);
          setMaterialDriveUrl(metaRes.webViewLink);
        }
      } else {
        setMatStage('metadata_failed');
        setMatErrorMessage(metaRes.message || 'File sudah tersimpan di Google Drive, tetapi pencatatan ke database belum berhasil');
      }
    } catch (err: any) {
      setMatStage('metadata_failed');
      setMatErrorMessage('File sudah tersimpan di Google Drive, tetapi pencatatan ke database belum berhasil');
    }
  };

  const executeMatUpload = async (): Promise<string> => {
    if (!matFile) {
      return materialDriveUrl;
    }

    // If metadata save failed previously but file is already in Drive
    if (matStage === 'metadata_failed' && matFileId) {
      await doSaveMatMetadata(matFileId, matWebViewLink);
      return matWebViewLink || materialDriveUrl;
    }

    // If already fully completed or uploaded
    if ((matStage === 'drive_uploaded' || matStage === 'completed') && matFileId) {
      return matWebViewLink || materialDriveUrl;
    }

    if (!teacherName.trim() || !trainingName.trim()) {
      const message = 'Isi Nama Guru/Pegawai dan Nama Pelatihan terlebih dahulu agar nama file bahan materi dapat dibuat otomatis.';
      setMatErrorMessage(message);
      setMatStage('upload_failed');
      throw new Error(message);
    }

    const targetFileName = buildDriveFileName(matFile, 'material');
    setMatFileName(targetFileName);
    setMaterialFileName(targetFileName);
    setMatStage('uploading_drive');
    setMatProgress(0);
    setMatErrorMessage('');

    try {
      // Step 1: Upload to Google Drive (or retrieve existing)
      const driveRes = await uploadFileToDriveOnly(
        matFile,
        'material',
        matUploadId,
        (percent) => setMatProgress(percent),
        targetFileName
      );

      setMatFileId(driveRes.fileId);
      setMatWebViewLink(driveRes.webViewLink);
      setMaterialDriveUrl(driveRes.webViewLink);
      setMaterialFileName(targetFileName);
      setMatStage('drive_uploaded');

      // Step 2: Save metadata to Supabase
      await doSaveMatMetadata(driveRes.fileId, driveRes.webViewLink, targetFileName);
      return driveRes.webViewLink;
    } catch (error: any) {
      setMatStage('upload_failed');
      setMatErrorMessage(error.message || 'Gagal mengunggah Bahan Materi ke Google Drive.');
      throw error;
    }
  };

  const isUploadingAny = 
    certStage === 'uploading_drive' || certStage === 'saving_metadata' ||
    matStage === 'uploading_drive' || matStage === 'saving_metadata';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherName || !trainingName) {
      alert('Mohon lengkapi nama guru dan nama pelatihan.');
      return;
    }

    if (isUploadingAny) {
      alert('Proses upload file sedang berjalan. Harap tunggu hingga proses upload selesai sebelum menyimpan.');
      return;
    }

    let finalCertUrl = certificateDriveUrl;
    let finalMatUrl = materialDriveUrl;

    if (certFile && certStage !== 'completed' && certStage !== 'drive_uploaded') {
      try {
        finalCertUrl = await executeCertUpload();
      } catch {
        alert('Gagal memproses sertifikat. Harap periksa pesan kesalahan file sertifikat terlebih dahulu.');
        return;
      }
    }

    if (matFile && matStage !== 'completed' && matStage !== 'drive_uploaded') {
      try {
        finalMatUrl = await executeMatUpload();
      } catch {
        alert('Gagal memproses bahan materi. Harap periksa pesan kesalahan file materi terlebih dahulu.');
        return;
      }
    }

    let finalTeacherId = teacherId;
    if (isAddingNewTeacher && onAddTeacher) {
      const newTeacher: Teacher = {
        id: 't-' + Date.now(),
        name: teacherName,
        role: teacherRole || 'Guru SD Lazuardi',
      };
      onAddTeacher(newTeacher);
      finalTeacherId = newTeacher.id;
    }

    const finalCategory = category === 'Lain-lain' ? (customCategory.trim() || 'Lain-lain') : category;

    setIsSavingArchive(true);
    try {
      await onSave({
        id: recordId,
        teacherId: finalTeacherId,
        teacherName,
        teacherRole,
        trainingName,
        organizer: organizer || 'SD Lazuardi',
        startDate,
        endDate: endDate || startDate,
        hours: Number(hours) || 8,
        category: finalCategory,
        location: location || 'SD Lazuardi',
        notes,
        certificateDriveUrl: finalCertUrl,
        certificateFileName: certificateFileName || (certFile ? buildDriveFileName(certFile, 'certificate') : 'Sertifikat_Pelatihan.pdf'),
        materialDriveUrl: finalMatUrl,
        materialFileName: materialFileName || (matFile ? buildDriveFileName(matFile, 'material') : 'Bahan_Materi.pdf'),
      });
      onClose();
    } catch (error: any) {
      alert(error?.message || 'Data pelatihan belum berhasil disimpan. Silakan coba lagi.');
    } finally {
      setIsSavingArchive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-3xl w-full max-w-2xl border border-[#E5E2D9] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="p-5 bg-[#FAF7F0] border-b border-[#E5E2D9] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#2C3327] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1c59c6]" />
              <span>{initialData ? 'Edit Data Pelatihan Guru' : 'Input Arsip Pelatihan Guru Baru'}</span>
            </h3>
            <p className="text-xs text-[#7A756D] mt-0.5">
              Simpan bukti fisik sertifikat dan bahan materi langsung ke Google Drive & Supabase
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A756D] hover:text-[#2C3327] hover:bg-[#EAE7DF] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Config Warning Banner */}
        {configStatus && !configStatus.configured && (
          <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Informasi Konfigurasi Environment Variable Backend:</p>
              <p className="text-[11px] leading-relaxed">
                Untuk mengaktifkan upload otomatis ke Google Drive & Supabase, pastikan variabel berikut diisi di server/Vercel (Environment Variables):
                <code className="block font-mono bg-amber-100/80 p-1 rounded-md text-[10px] mt-1 text-amber-950">
                  GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID, GOOGLE_DRIVE_MATERIAL_FOLDER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
                </code>
              </p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Informasi Guru */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c59c6] flex items-center gap-1.5">
              <span>1. Identitas Guru / Pegawai</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-[#2C3327] mb-1">Nama Guru / Pegawai *</label>
                <input
                  type="text"
                  placeholder="Ketik nama guru / pegawai..."
                  value={teacherName}
                  onChange={e => handleTeacherNameChange(e.target.value)}
                  onFocus={() => setIsTeacherDropdownOpen(Boolean(teacherName.trim()))}
                  onBlur={() => window.setTimeout(() => setIsTeacherDropdownOpen(false), 150)}
                  autoComplete="off"
                  required
                  className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs font-medium text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6] focus:outline-hidden"
                />

                {isTeacherDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-[#D9D5CB] bg-white shadow-xl">
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map(teacher => (
                        <button
                          key={teacher.id}
                          type="button"
                          onMouseDown={event => {
                            event.preventDefault();
                            selectTeacher(teacher);
                          }}
                          className="w-full px-3 py-2.5 text-left text-xs text-[#2C3327] hover:bg-[#EDF3FC] border-b border-[#F0EEE8] last:border-b-0"
                        >
                          <span className="block font-semibold">{teacher.name}</span>
                          {teacher.role && (
                            <span className="block mt-0.5 text-[10px] text-[#7A756D]">
                              {teacher.role}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2.5 text-[11px] text-[#7A756D]">
                        Nama tidak ditemukan. Nama yang diketik akan disimpan sebagai pegawai baru.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C3327] mb-1">Jabatan / Peran di Sekolah</label>
                <input
                  type="text"
                  placeholder="misal: Guru Kelas / Koordinator Inklusi"
                  value={teacherRole}
                  onChange={e => setTeacherRole(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Pelatihan */}
          <div className="space-y-4 pt-2 border-t border-[#E5E2D9]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c59c6] flex items-center gap-1.5">
              <span>2. Detail Pelatihan / Workshop</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#2C3327] mb-1">Nama / Judul Pelatihan *</label>
              <input
                type="text"
                placeholder="misal: Workshop Strategi Asesmen Inklusi SD"
                value={trainingName}
                onChange={e => setTrainingName(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2C3327] mb-1">Penyelenggara</label>
                <input
                  type="text"
                  placeholder="misal: Kemendikbudristek / Google Educator"
                  value={organizer}
                  onChange={e => setOrganizer(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C3327] mb-1">Kategori Pelatihan</label>
                <select
                  value={category}
                  onChange={e => {
                    const val = e.target.value;
                    setCategory(val);
                    if (val !== 'Lain-lain') {
                      setCustomCategory('');
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs font-medium text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
                >
                  {standardCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Lain-lain">Lain-lain (Isi Sendiri)</option>
                </select>

                {category === 'Lain-lain' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Ketik nama kategori pelatihan baru..."
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-[#1c59c6] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#2C3327] mb-1">Tanggal Pelaksanaan *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full p-2 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C3327] mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C3327] mb-1">Durasi (Jam Pelajaran / JP)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={hours}
                  onChange={e => setHours(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6] font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C3327] mb-1">Refleksi Hasil Pelatihan</label>
              <textarea
                rows={3}
                placeholder="Tuliskan refleksi hasil pelatihan, poin-poin pembelajaran, dan rencana tindak lanjut di kelas/sekolah..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#D9D5CB] rounded-xl text-xs text-[#2C3327] focus:ring-2 focus:ring-[#1c59c6]"
              />
            </div>
          </div>

          {/* Section 3: Upload Sertifikat Pendukung */}
          <div className="space-y-3 bg-[#edf3fc] p-4 rounded-2xl border border-[#d2e3fc]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c59c6] flex items-center gap-1.5">
                <FolderCheck className="w-4 h-4 text-[#1c59c6]" /> 3. Upload Sertifikat (PDF, JPG, JPEG, PNG - Max 10 MB)
              </h4>
            </div>

            <div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                onChange={handleFileChangeCert}
                className="w-full text-xs text-[#7A756D] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1c59c6] file:text-white hover:file:bg-[#1547a1] cursor-pointer"
              />

              {certFile && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#2C3327]">
                    <span className="font-semibold truncate max-w-[240px]">{certFile.name}</span>
                    <span className="text-[#7A756D] font-mono">{(certFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <p className="text-[11px] text-[#5F6B5B] break-words">
                    Nama di Google Drive: <span className="font-semibold">{certStage === 'idle' || certStage === 'upload_failed' ? buildDriveFileName(certFile, 'certificate') : certFileName}</span>
                  </p>

                  <button
                    type="button"
                    onClick={executeCertUpload}
                    disabled={certStage === 'uploading_drive' || certStage === 'saving_metadata' || certStage === 'drive_uploaded' || certStage === 'completed' || certStage === 'metadata_failed'}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1c59c6] hover:bg-[#1547a1] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60"
                  >
                    {certStage === 'uploading_drive' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah Sertifikat ke Drive ({certProgress}%)...</span>
                      </>
                    )}
                    {certStage === 'saving_metadata' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Catatan ke Database...</span>
                      </>
                    )}
                    {(certStage === 'drive_uploaded' || certStage === 'completed' || certStage === 'metadata_failed') && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Sudah Terunggah di Google Drive</span>
                      </>
                    )}
                    {(certStage === 'idle' || certStage === 'upload_failed') && (
                      <>
                        <CloudUpload className="w-4 h-4" />
                        <span>Upload Sertifikat ke Drive & Supabase</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Progress Bar Sertifikat */}
              {(certStage === 'uploading_drive' || certStage === 'saving_metadata') && (
                <div className="mt-2.5 w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-[#1c59c6] h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${certStage === 'saving_metadata' ? 100 : certProgress}%` }}
                  />
                </div>
              )}

              {/* Status & Error Display for Certificate */}
              {certStage === 'drive_uploaded' && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File berhasil diunggah ke Google Drive</span>
                </div>
              )}

              {certStage === 'completed' && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File berhasil diunggah ke Google Drive dan tersimpan di database.</span>
                </div>
              )}

              {certStage === 'metadata_failed' && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>File sudah tersimpan di Google Drive, tetapi pencatatan ke database belum berhasil</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => doSaveCertMetadata()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Simpan Data Lagi</span>
                  </button>
                </div>
              )}

              {certStage === 'upload_failed' && certErrorMessage && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{certErrorMessage}</span>
                </div>
              )}

              {/* View File Button */}
              {(certWebViewLink || certificateDriveUrl) && (
                <div className="mt-3 pt-2 border-t border-[#d2e3fc] flex items-center justify-between">
                  <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Sertifikat Terhubung
                  </span>
                  <a
                    href={certWebViewLink || certificateDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c59c6] text-white text-xs font-bold hover:bg-[#1547a1] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Lihat File
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Upload Bahan Materi */}
          <div className="space-y-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2D9]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8860B] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#B8860B]" /> 4. Upload Bahan Materi (PDF, PPT, DOC, XLS - Max 50 MB)
              </h4>
            </div>

            <div>
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChangeMat}
                className="w-full text-xs text-[#7A756D] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#B8860B] file:text-white hover:file:bg-[#9a7008] cursor-pointer"
              />

              {matFile && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#2C3327]">
                    <span className="font-semibold truncate max-w-[240px]">{matFile.name}</span>
                    <span className="text-[#7A756D] font-mono">{(matFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <p className="text-[11px] text-[#6F5A19] break-words">
                    Nama di Google Drive: <span className="font-semibold">{matStage === 'idle' || matStage === 'upload_failed' ? buildDriveFileName(matFile, 'material') : matFileName}</span>
                  </p>

                  <button
                    type="button"
                    onClick={executeMatUpload}
                    disabled={matStage === 'uploading_drive' || matStage === 'saving_metadata' || matStage === 'drive_uploaded' || matStage === 'completed' || matStage === 'metadata_failed'}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#B8860B] hover:bg-[#9a7008] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60"
                  >
                    {matStage === 'uploading_drive' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah Materi ke Drive ({matProgress}%)...</span>
                      </>
                    )}
                    {matStage === 'saving_metadata' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Catatan ke Database...</span>
                      </>
                    )}
                    {(matStage === 'drive_uploaded' || matStage === 'completed' || matStage === 'metadata_failed') && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Sudah Terunggah di Google Drive</span>
                      </>
                    )}
                    {(matStage === 'idle' || matStage === 'upload_failed') && (
                      <>
                        <CloudUpload className="w-4 h-4 text-[#fff]" />
                        <span>Upload Materi ke Drive & Supabase</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Progress Bar Materi */}
              {(matStage === 'uploading_drive' || matStage === 'saving_metadata') && (
                <div className="mt-2.5 w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-[#B8860B] h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${matStage === 'saving_metadata' ? 100 : matProgress}%` }}
                  />
                </div>
              )}

              {/* Status & Error Display for Material */}
              {matStage === 'drive_uploaded' && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File berhasil diunggah ke Google Drive</span>
                </div>
              )}

              {matStage === 'completed' && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File berhasil diunggah ke Google Drive dan tersimpan di database.</span>
                </div>
              )}

              {matStage === 'metadata_failed' && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>File sudah tersimpan di Google Drive, tetapi pencatatan ke database belum berhasil</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => doSaveMatMetadata()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Simpan Data Lagi</span>
                  </button>
                </div>
              )}

              {matStage === 'upload_failed' && matErrorMessage && (
                <div className="mt-2.5 p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{matErrorMessage}</span>
                </div>
              )}

              {/* View File Button */}
              {(matWebViewLink || materialDriveUrl) && (
                <div className="mt-3 pt-2 border-t border-[#E5E2D9] flex items-center justify-between">
                  <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Materi Terhubung
                  </span>
                  <a
                    href={matWebViewLink || materialDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8860B] text-white text-xs font-bold hover:bg-[#9a7008] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Lihat File
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#E5E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D9D5CB] text-xs font-semibold text-[#7A756D] hover:bg-[#F2EFE9] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploadingAny || isSavingArchive}
              className="px-6 py-2.5 rounded-xl bg-[#1c59c6] hover:bg-[#1547a1] text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center space-x-2 disabled:opacity-50"
            >
              {isUploadingAny || isSavingArchive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSavingArchive ? 'Menyimpan Arsip...' : 'Proses Upload File...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{initialData ? 'Simpan Perubahan' : 'Arsipkan Pelatihan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

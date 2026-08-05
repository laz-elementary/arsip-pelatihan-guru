export type UploadStage =
  | 'idle'
  | 'uploading_drive'
  | 'drive_uploaded'
  | 'saving_metadata'
  | 'completed'
  | 'metadata_failed'
  | 'upload_failed';

export interface DriveUploadStepResult {
  fileId: string;
  webViewLink: string;
  uploadId: string;
}

export interface FinalizeStepResult {
  ok: boolean;
  driveUploaded: boolean;
  metadataSaved: boolean;
  fileId: string;
  webViewLink: string;
  uploadId: string;
  errorStage?: 'drive' | 'supabase';
  message?: string;
}

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  mimeType: string;
  fileSize: number;
  fileType: 'certificate' | 'material';
  supabaseSaved?: boolean;
  supabaseError?: string;
}

/**
 * Safely parses JSON response without crashing on empty response bodies
 */

export async function safeJsonParse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text || !text.trim()) {
    return null;
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  return { raw: text };
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Google Drive can finish storing a resumable upload while the browser fails
 * to read the cross-origin response. Reconcile by asking our own server to
 * search the target Drive folder using the stable archiveUploadId.
 */
async function reconcileDriveUpload(
  uploadId: string,
  fileType: 'certificate' | 'material',
  attempts = 6
): Promise<DriveUploadStepResult | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) {
      await sleep(650 * attempt);
    }

    try {
      const response = await fetch('/api/drive/resolve-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, fileType }),
      });
      const data = await safeJsonParse(response);

      if (response.ok && data?.found && data?.fileId) {
        return {
          fileId: data.fileId,
          webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.fileId}/view?usp=drivesdk`,
          uploadId,
        };
      }
    } catch {
      // Retry briefly because Drive search can be eventually consistent.
    }
  }

  return null;
}

/**
 * Stage 1: Upload file to Google Drive (or reuse if existing)
 */
export async function uploadFileToDriveOnly(
  file: File,
  fileType: 'certificate' | 'material',
  uploadId: string,
  onProgress?: (progressPercent: number) => void,
  customFileName?: string
): Promise<DriveUploadStepResult> {
  const fileNameForDrive = customFileName?.trim() || file.name;

  // 1. Client-side preliminary validation
  const ext = ('.' + file.name.split('.').pop()).toLowerCase();

  if (fileType === 'certificate') {
    const maxCertSize = 10 * 1024 * 1024;
    if (file.size > maxCertSize) {
      throw new Error(`Ukuran file sertifikat "${file.name}" melebihi 10 MB (Ukuran file: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
    }
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowed.includes(ext)) {
      throw new Error(`Format file sertifikat "${file.name}" tidak didukung. Harap gunakan PDF, JPG, JPEG, atau PNG.`);
    }
  } else if (fileType === 'material') {
    const maxMatSize = 50 * 1024 * 1024;
    if (file.size > maxMatSize) {
      throw new Error(`Ukuran file materi "${file.name}" melebihi 50 MB (Ukuran file: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
    }
    const allowed = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
    if (!allowed.includes(ext)) {
      throw new Error(`Format file materi "${file.name}" tidak didukung. Harap gunakan PDF, PPT, PPTX, DOC, DOCX, XLS, atau XLSX.`);
    }
  }

  // 2. Request Resumable Upload URL or Check Existing File
  const initRes = await fetch('/api/drive/create-resumable-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: fileNameForDrive,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      fileType,
      uploadId,
    }),
  });

  const initData = await safeJsonParse(initRes);
  if (!initRes.ok || !initData || initData.ok === false) {
    const errMsg = initData?.message || initData?.error || 'Gagal membuat sesi upload Google Drive di server.';
    throw new Error(errMsg);
  }

  // Check if file was found in Drive via archiveUploadId
  if (initData.existingFile && initData.fileId) {
    if (onProgress) onProgress(100);
    return {
      fileId: initData.fileId,
      webViewLink: initData.webViewLink || `https://drive.google.com/file/d/${initData.fileId}/view?usp=drivesdk`,
      uploadId,
    };
  }

  const { uploadUrl } = initData;
  if (!uploadUrl) {
    throw new Error('Server tidak mengembalikan URL upload Google Drive.');
  }

  // 3. Upload file directly from browser to Google Drive via PUT XHR.
  // Some browsers report xhr.onerror after Drive has already accepted the
  // bytes because the final cross-origin response cannot be read. Every
  // ambiguous outcome is reconciled through our server before showing a
  // failure, so retrying cannot create duplicate files.
  const uploadedFileId = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    let reconciliationRunning = false;

    const finishResolve = (fileId: string) => {
      if (settled) return;
      settled = true;
      if (onProgress) onProgress(100);
      resolve(fileId);
    };

    const finishReject = (message: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    };

    const reconcileOrReject = async (fallbackMessage: string) => {
      if (settled || reconciliationRunning) return;
      reconciliationRunning = true;
      const reconciled = await reconcileDriveUpload(uploadId, fileType);
      reconciliationRunning = false;

      if (reconciled?.fileId) {
        finishResolve(reconciled.fileId);
      } else {
        finishReject(fallbackMessage);
      }
    };

    xhr.open('PUT', uploadUrl, true);
    xhr.timeout = 180_000;

    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.responseText && xhr.responseText.trim()) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            if (responseData?.id) {
              finishResolve(responseData.id);
              return;
            }
          } catch {
            // Fall through to server-side reconciliation.
          }
        }

        await reconcileOrReject('File kemungkinan sudah terkirim, tetapi ID file belum dapat dikonfirmasi dari Google Drive.');
        return;
      }

      let message = `Gagal mengunggah file ke Google Drive (Status HTTP ${xhr.status}).`;
      if (xhr.responseText && xhr.responseText.trim()) {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.error?.message) message += ` - ${errorResponse.error.message}`;
        } catch {
          message += ` - ${xhr.responseText.slice(0, 300)}`;
        }
      }
      await reconcileOrReject(message);
    };

    xhr.onerror = async () => {
      await reconcileOrReject('Google Drive belum dapat mengonfirmasi hasil upload. File tidak akan diunggah ulang sebelum pemeriksaan selesai.');
    };

    xhr.ontimeout = async () => {
      await reconcileOrReject('Waktu tunggu upload berakhir dan hasil upload belum dapat dikonfirmasi.');
    };

    xhr.onabort = () => {
      finishReject('Proses upload dibatalkan.');
    };

    xhr.send(file);
  });

  const webViewLink = `https://drive.google.com/file/d/${uploadedFileId}/view?usp=drivesdk`;

  return {
    fileId: uploadedFileId,
    webViewLink,
    uploadId,
  };
}

/**
 * Stage 2: Save file metadata to Supabase
 */
export async function saveFileMetadataToSupabase(params: {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileType: 'certificate' | 'material';
  uploadId: string;
  trainingId?: string;
}): Promise<FinalizeStepResult> {
  const finalRes = await fetch('/api/drive/finalize-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const finalData = await safeJsonParse(finalRes);

  if (!finalRes.ok || !finalData) {
    return {
      ok: false,
      driveUploaded: true,
      metadataSaved: false,
      fileId: params.fileId,
      webViewLink: `https://drive.google.com/file/d/${params.fileId}/view?usp=drivesdk`,
      uploadId: params.uploadId,
      errorStage: 'supabase',
      message: finalData?.message || 'File sudah tersimpan di Google Drive, tetapi metadata belum tersimpan',
    };
  }

  return finalData as FinalizeStepResult;
}

/**
 * Backward-compatible full upload helper
 */
export async function uploadFileToDriveAndSupabase(
  file: File,
  fileType: 'certificate' | 'material',
  trainingId?: string,
  onProgress?: (progressPercent: number) => void
): Promise<DriveUploadResult> {
  const uploadId = crypto.randomUUID();
  const step1 = await uploadFileToDriveOnly(file, fileType, uploadId, onProgress);
  const step2 = await saveFileMetadataToSupabase({
    fileId: step1.fileId,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    fileType,
    uploadId,
    trainingId,
  });

  return {
    fileId: step1.fileId,
    fileName: file.name,
    webViewLink: step2.webViewLink || step1.webViewLink,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    fileType,
    supabaseSaved: step2.metadataSaved,
    supabaseError: step2.metadataSaved ? undefined : step2.message,
  };
}

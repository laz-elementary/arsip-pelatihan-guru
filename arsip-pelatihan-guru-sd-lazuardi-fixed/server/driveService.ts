import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

export interface ResumableUploadParams {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileType: 'certificate' | 'material';
  uploadId?: string;
}


export interface ResolveUploadParams {
  uploadId: string;
  fileType: 'certificate' | 'material';
}

export interface FinalizeUploadParams {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileType: 'certificate' | 'material';
  trainingId?: string;
  uploadId?: string;
}

// Extension and MIME validation rules
const CERTIFICATE_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MATERIAL_MAX_SIZE = 50 * 1024 * 1024;    // 50 MB

const ALLOWED_CERT_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_MAT_EXT = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];

/**
 * Validates file type and size based on requirement 15
 */
export function validateFileRules(fileName: string, mimeType: string, fileSize: number, fileType: 'certificate' | 'material') {
  const ext = ('.' + fileName.split('.').pop()).toLowerCase();
  
  if (fileType === 'certificate') {
    if (fileSize > CERTIFICATE_MAX_SIZE) {
      throw new Error(`Ukuran file sertifikat melebihi batas maksimal 10 MB (Ukuran file: ${(fileSize / (1024 * 1024)).toFixed(1)} MB).`);
    }
    const isAllowedExt = ALLOWED_CERT_EXT.includes(ext);
    const isAllowedMime = mimeType.startsWith('image/') || mimeType === 'application/pdf';
    if (!isAllowedExt || !isAllowedMime) {
      throw new Error(`Jenis file sertifikat tidak didukung. Format yang diizinkan: PDF, JPG, JPEG, PNG.`);
    }
  } else if (fileType === 'material') {
    if (fileSize > MATERIAL_MAX_SIZE) {
      throw new Error(`Ukuran file materi melebihi batas maksimal 50 MB (Ukuran file: ${(fileSize / (1024 * 1024)).toFixed(1)} MB).`);
    }
    const isAllowedExt = ALLOWED_MAT_EXT.includes(ext);
    if (!isAllowedExt) {
      throw new Error(`Jenis file materi tidak didukung. Format yang diizinkan: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX.`);
    }
  }
}

/**
 * Obtains an OAuth 2.0 Access Token for Google Drive using the Service Account credentials
 */
export async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Credential Service Account Google (GOOGLE_CLIENT_EMAIL atau GOOGLE_PRIVATE_KEY) belum dikonfigurasi di environment variable server.');
  }

  // Handle escaped newlines in environment variable
  privateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  let tokenAssertion: string;
  try {
    tokenAssertion = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  } catch (err: any) {
    throw new Error(`Gagal menandatangani kunci privat Service Account Google: ${err?.message || 'Format private key salah'}.`);
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: tokenAssertion,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    const errorMsg = tokenData.error_description || tokenData.error || 'Autentikasi Service Account gagal';
    throw new Error(`Gagal mendapatkan akses token dari Google Auth: ${errorMsg}`);
  }

  return tokenData.access_token;
}

/**
 * Initiates a Google Drive Resumable Upload Session
 */
export async function createResumableUploadSession(params: ResumableUploadParams) {
  const { fileName, mimeType, fileSize, fileType, uploadId } = params;

  // 1. Validate rules
  validateFileRules(fileName, mimeType, fileSize, fileType);

  // 2. Resolve Folder ID
  const folderId = fileType === 'certificate'
    ? process.env.GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID
    : process.env.GOOGLE_DRIVE_MATERIAL_FOLDER_ID;

  if (!folderId) {
    throw new Error(`GOOGLE_DRIVE_${fileType.toUpperCase()}_FOLDER_ID belum diatur pada environment variable server.`);
  }

  // 3. Obtain Access Token
  const accessToken = await getGoogleAccessToken();

  // 4. Idempotency Check: Search if file with same archiveUploadId already exists in folder
  if (uploadId) {
    console.log(`[Drive Upload Stage] Checking for existing file with uploadId "${uploadId}" in folder "${folderId}"...`);
    try {
      const query = `'${folderId}' in parents and appProperties has { key='archiveUploadId' and value='${uploadId}' } and trashed = false`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,webContentLink,mimeType,size)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const existingFile = searchData.files[0];
          const webViewLink = existingFile.webViewLink || `https://drive.google.com/file/d/${existingFile.id}/view?usp=drivesdk`;
          console.log(`[Drive Upload Stage] Found existing file in Drive! fileId: ${existingFile.id}, uploadId: ${uploadId}`);
          return {
            existingFile: true,
            fileId: existingFile.id,
            webViewLink,
            uploadUrl: null,
            folderId
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Drive Upload Stage] Warning checking existing file by archiveUploadId:`, err?.message || err);
    }
  }

  // 5. Request Resumable Upload URL from Google Drive API
  console.log(`[Drive Upload Stage] Initiating new Google Drive resumable upload session for "${fileName}" (${fileSize} bytes), uploadId: "${uploadId || 'N/A'}"`);
  const driveUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true';
  const response = await fetch(driveUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType || 'application/octet-stream',
      'X-Upload-Content-Length': fileSize.toString(),
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      appProperties: uploadId ? {
        archiveUploadId: uploadId,
        archiveFileType: fileType
      } : undefined
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr: any = {};
    try { parsedErr = JSON.parse(errText); } catch {}

    const status = response.status;
    const message = parsedErr?.error?.message || errText;

    if (status === 404) {
      throw new Error(`Folder Google Drive tidak ditemukan (Folder ID: ${folderId}). Pastikan ID folder di environment variable sudah benar.`);
    }
    if (status === 403) {
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      throw new Error(`Service account (${clientEmail}) tidak memiliki akses ke folder Google Drive ini. Pastikan folder telah dibagikan (Shared) ke email service account dengan role Editor.`);
    }
    if (message.includes('API has not been used') || message.includes('disabled')) {
      throw new Error(`Google Drive API belum diaktifkan pada Google Cloud Console proyek ini.`);
    }

    throw new Error(`Google Drive API Error (${status}): ${message}`);
  }

  const uploadUrl = response.headers.get('location');
  if (!uploadUrl) {
    throw new Error('Google Drive API tidak mengembalikan Header Location untuk resumable upload.');
  }

  return { uploadUrl, folderId };
}

/**
 * Reconciles a browser upload that may have completed in Google Drive even when
 * the browser could not read the cross-origin response. This prevents duplicate
 * uploads after an XHR network/CORS error.
 */
export async function findUploadedFileByUploadId(params: ResolveUploadParams) {
  const { uploadId, fileType } = params;

  if (!uploadId) {
    throw new Error('uploadId wajib diisi untuk memeriksa hasil upload Google Drive.');
  }

  const folderId = fileType === 'certificate'
    ? process.env.GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID
    : process.env.GOOGLE_DRIVE_MATERIAL_FOLDER_ID;

  if (!folderId) {
    throw new Error(`Folder Google Drive untuk ${fileType === 'certificate' ? 'sertifikat' : 'materi'} belum dikonfigurasi.`);
  }

  const accessToken = await getGoogleAccessToken();
  const escapedUploadId = uploadId.replace(/'/g, "\\'");
  const query = `'${folderId}' in parents and appProperties has { key='archiveUploadId' and value='${escapedUploadId}' } and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,mimeType,size,createdTime)&orderBy=createdTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=10`;

  const response = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal memeriksa hasil upload Google Drive (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const file = Array.isArray(data?.files) ? data.files[0] : null;

  if (!file?.id) {
    return { found: false };
  }

  return {
    found: true,
    fileId: file.id,
    fileName: file.name,
    mimeType: file.mimeType,
    fileSize: Number(file.size || 0),
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view?usp=drivesdk`,
  };
}

/**
 * Performs a comprehensive, read-only diagnostic check for Supabase and Google Drive integrations.
 * Strictly READ-ONLY: Does not upload files, mutate data, or expose private credentials.
 */
export async function performIntegrationDiagnostics() {
  const googleEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const certFolderId = process.env.GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID;
  const matFolderId = process.env.GOOGLE_DRIVE_MATERIAL_FOLDER_ID;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const result = {
    timestamp: new Date().toISOString(),
    envVars: {
      GOOGLE_CLIENT_EMAIL: { configured: Boolean(googleEmail), value: googleEmail ? googleEmail : undefined },
      GOOGLE_PRIVATE_KEY: { configured: Boolean(googlePrivateKey), value: googlePrivateKey ? '*** (Rahasia / Encrypted Key Tersedia)' : undefined },
      GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID: { configured: Boolean(certFolderId), value: certFolderId ? certFolderId : undefined },
      GOOGLE_DRIVE_MATERIAL_FOLDER_ID: { configured: Boolean(matFolderId), value: matFolderId ? matFolderId : undefined },
      SUPABASE_URL: { configured: Boolean(supabaseUrl), value: supabaseUrl ? supabaseUrl : undefined },
      SUPABASE_SERVICE_ROLE_KEY: { configured: Boolean(supabaseKey), value: supabaseKey ? '*** (Rahasia / Service Role Key Tersedia)' : undefined },
    },
    supabase: {
      connected: false,
      tableAvailable: false,
      message: '',
      tableName: 'training_files',
    },
    googleDrive: {
      authConnected: false,
      authMessage: '',
      clientEmail: googleEmail || null,
      certFolder: {
        found: false,
        name: null as string | null,
        message: '',
      },
      matFolder: {
        found: false,
        name: null as string | null,
        message: '',
      },
    },
  };

  // 1. Test Supabase Connection & Table Existence (Read-Only)
  if (!supabaseUrl || !supabaseKey) {
    result.supabase.message = 'SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di environment variable server.';
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Perform harmless read-only queries to verify both required tables.
      const filesCheck = await supabase
        .from('training_files')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      const trainingsCheck = await supabase
        .from('trainings')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      const firstError = filesCheck.error || trainingsCheck.error;
      const status = filesCheck.status >= 400 ? filesCheck.status : trainingsCheck.status;

      if (!firstError) {
        result.supabase.connected = true;
        result.supabase.tableAvailable = true;
        result.supabase.message = `Koneksi Supabase berhasil. Tabel 'trainings' dan 'training_files' siap digunakan.`;
      } else {
        const errCode = firstError.code || '';
        const errMsg = firstError.message || '';

        if (errCode === '42P01' || errMsg.includes('does not exist') || errMsg.includes('not found') || status === 404) {
          result.supabase.connected = true;
          result.supabase.tableAvailable = false;
          result.supabase.message = `Terhubung ke Supabase, tetapi tabel 'trainings' dan/atau 'training_files' belum lengkap. Jalankan file SUPABASE_SETUP.sql.`;
        } else if (errCode === 'PGRST301' || status === 401 || status === 403 || errMsg.includes('JWT') || errMsg.includes('apikey')) {
          result.supabase.connected = false;
          result.supabase.tableAvailable = false;
          result.supabase.message = `Gagal autentikasi Supabase (${status || errCode}): SUPABASE_SERVICE_ROLE_KEY tidak valid.`;
        } else {
          result.supabase.connected = false;
          result.supabase.tableAvailable = false;
          result.supabase.message = `Gagal terhubung ke Supabase: ${errMsg} (${errCode})`;
        }
      }
    } catch (err: any) {
      result.supabase.connected = false;
      result.supabase.tableAvailable = false;
      result.supabase.message = `Gagal menginisialisasi client Supabase: ${err?.message || err}`;
    }
  }

  // 2. Test Google Drive Service Account Auth
  let accessToken = '';
  if (!googleEmail || !googlePrivateKey) {
    result.googleDrive.authMessage = 'GOOGLE_CLIENT_EMAIL atau GOOGLE_PRIVATE_KEY belum diisi di environment variable server.';
  } else {
    try {
      accessToken = await getGoogleAccessToken();
      result.googleDrive.authConnected = true;
      result.googleDrive.authMessage = `Autentikasi Service Account Google Drive (${googleEmail}) berhasil.`;
    } catch (err: any) {
      result.googleDrive.authConnected = false;
      result.googleDrive.authMessage = `Autentikasi Service Account Google Drive gagal: ${err?.message || err}`;
    }
  }

  // 3. Test Certificate Folder (Read-Only GET Request)
  if (!certFolderId) {
    result.googleDrive.certFolder.message = 'GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID belum diisi di environment variable.';
  } else if (!result.googleDrive.authConnected || !accessToken) {
    result.googleDrive.certFolder.message = 'Pemeriksaan folder dibatalkan karena autentikasi Google Drive gagal.';
  } else {
    try {
      const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${certFolderId}?fields=id,name,mimeType,trashed&supportsAllDrives=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (folderRes.ok) {
        const folderData = await folderRes.json();
        if (folderData.trashed) {
          result.googleDrive.certFolder.found = false;
          result.googleDrive.certFolder.message = `Folder sertifikat (ID: ${certFolderId}) berada di tempat sampah (Trash).`;
        } else {
          result.googleDrive.certFolder.found = true;
          result.googleDrive.certFolder.name = folderData.name || 'Folder Sertifikat';
          result.googleDrive.certFolder.message = `Folder sertifikat "${folderData.name}" ditemukan di Google Drive.`;
        }
      } else {
        const status = folderRes.status;
        const errText = await folderRes.text();
        if (status === 404) {
          result.googleDrive.certFolder.message = `Folder sertifikat dengan ID "${certFolderId}" tidak ditemukan. Pastikan ID folder sudah benar.`;
        } else if (status === 403) {
          result.googleDrive.certFolder.message = `Akses ditolak (403): Bagikan (Share) folder ini ke email Service Account (${googleEmail}) dengan akses Editor.`;
        } else {
          result.googleDrive.certFolder.message = `Google Drive API error (${status}): ${errText}`;
        }
      }
    } catch (err: any) {
      result.googleDrive.certFolder.message = `Gagal memeriksa folder sertifikat: ${err?.message || err}`;
    }
  }

  // 4. Test Material Folder (Read-Only GET Request)
  if (!matFolderId) {
    result.googleDrive.matFolder.message = 'GOOGLE_DRIVE_MATERIAL_FOLDER_ID belum diisi di environment variable.';
  } else if (!result.googleDrive.authConnected || !accessToken) {
    result.googleDrive.matFolder.message = 'Pemeriksaan folder dibatalkan karena autentikasi Google Drive gagal.';
  } else {
    try {
      const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${matFolderId}?fields=id,name,mimeType,trashed&supportsAllDrives=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (folderRes.ok) {
        const folderData = await folderRes.json();
        if (folderData.trashed) {
          result.googleDrive.matFolder.found = false;
          result.googleDrive.matFolder.message = `Folder materi (ID: ${matFolderId}) berada di tempat sampah (Trash).`;
        } else {
          result.googleDrive.matFolder.found = true;
          result.googleDrive.matFolder.name = folderData.name || 'Folder Materi';
          result.googleDrive.matFolder.message = `Folder materi "${folderData.name}" ditemukan di Google Drive.`;
        }
      } else {
        const status = folderRes.status;
        const errText = await folderRes.text();
        if (status === 404) {
          result.googleDrive.matFolder.message = `Folder materi dengan ID "${matFolderId}" tidak ditemukan. Pastikan ID folder sudah benar.`;
        } else if (status === 403) {
          result.googleDrive.matFolder.message = `Akses ditolak (403): Bagikan (Share) folder ini ke email Service Account (${googleEmail}) dengan akses Editor.`;
        } else {
          result.googleDrive.matFolder.message = `Google Drive API error (${status}): ${errText}`;
        }
      }
    } catch (err: any) {
      result.googleDrive.matFolder.message = `Gagal memeriksa folder materi: ${err?.message || err}`;
    }
  }

  return result;
}

/**
 * Finalizes file after client upload and registers file details in Supabase
 */
export async function finalizeUploadAndSaveToSupabase(params: FinalizeUploadParams) {
  const { fileId, fileName, mimeType, fileSize, fileType, trainingId, uploadId } = params;

  console.log(`[Drive Upload Stage] Finalizing upload for fileId: ${fileId}, uploadId: ${uploadId || 'N/A'}`);

  let webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

  try {
    const accessToken = await getGoogleAccessToken();

    // Make file readable by anyone with link
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    // Fetch details & official webViewLink
    const detailsRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,webContentLink,mimeType&supportsAllDrives=true`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (detailsRes.ok) {
      const data = await detailsRes.json();
      if (data.webViewLink) {
        webViewLink = data.webViewLink;
      }
    }
  } catch (e: any) {
    console.warn(`[Drive Upload Stage] Google Drive permission/details warning for fileId ${fileId}:`, e?.message || e);
  }

  console.log(`[Drive Upload Stage] Drive file ready. Received fileId: ${fileId}, webViewLink: ${webViewLink}`);

  // Save to Supabase table training_files using upsert on upload_id
  console.log(`[Supabase Save Stage] Attempting to save metadata to Supabase 'training_files' for fileId: ${fileId}, uploadId: ${uploadId || 'N/A'}`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`[Supabase Save Error] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada environment variable server.`);
    return {
      ok: false,
      driveUploaded: true,
      metadataSaved: false,
      fileId,
      webViewLink,
      uploadId: uploadId || '',
      errorStage: 'supabase',
      message: 'File sudah tersimpan di Google Drive, tetapi metadata belum tersimpan'
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseRow: any = {
      name: fileName,
      drive_file_id: fileId,
      web_view_link: webViewLink,
      mime_type: mimeType,
      file_size: fileSize,
      file_type: fileType,
      training_id: trainingId || null,
      created_at: new Date().toISOString(),
    };

    // Preferred schema: upload_id exists and has a UNIQUE constraint.
    // This makes metadata writes idempotent when the user retries.
    let saveError: any = null;
    if (uploadId) {
      const preferredRow = { ...baseRow, upload_id: uploadId };
      const preferredResult = await supabase
        .from('training_files')
        .upsert([preferredRow], { onConflict: 'upload_id' });
      saveError = preferredResult.error;
    }

    // Backward-compatible fallback for the earlier table schema that did not
    // contain upload_id. We deduplicate by drive_file_id instead of failing.
    const schemaNeedsFallback = Boolean(
      saveError && (
        saveError.code === '42703' ||
        saveError.code === '42P10' ||
        String(saveError.message || '').includes('upload_id') ||
        String(saveError.message || '').includes('no unique or exclusion constraint')
      )
    );

    if (!uploadId || schemaNeedsFallback) {
      if (schemaNeedsFallback) {
        console.warn('[Supabase Save Stage] Kolom/constraint upload_id belum tersedia. Menggunakan fallback drive_file_id.');
      }

      const existing = await supabase
        .from('training_files')
        .select('id')
        .eq('drive_file_id', fileId)
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        saveError = existing.error;
      } else if (existing.data?.id) {
        const updateResult = await supabase
          .from('training_files')
          .update(baseRow)
          .eq('id', existing.data.id);
        saveError = updateResult.error;
      } else {
        const insertResult = await supabase
          .from('training_files')
          .insert([baseRow]);
        saveError = insertResult.error;
      }
    }

    if (saveError) {
      console.error(`[Supabase Save Error] Supabase metadata error: ${saveError.message} (Code: ${saveError.code})`);
      return {
        ok: false,
        driveUploaded: true,
        metadataSaved: false,
        fileId,
        webViewLink,
        uploadId: uploadId || '',
        errorStage: 'supabase',
        message: `File sudah tersimpan di Google Drive, tetapi metadata belum tersimpan: ${saveError.message}`
      };
    }

    console.log(`[Supabase Save Stage] Successfully saved metadata to Supabase for fileId: ${fileId}, uploadId: ${uploadId || 'N/A'}`);
    return {
      ok: true,
      driveUploaded: true,
      metadataSaved: true,
      fileId,
      webViewLink,
      uploadId: uploadId || '',
      message: 'File berhasil diunggah ke Google Drive dan tersimpan di database.'
    };

  } catch (err: any) {
    console.error(`[Supabase Save Error] Exception while saving to Supabase: ${err?.message || err}`);
    return {
      ok: false,
      driveUploaded: true,
      metadataSaved: false,
      fileId,
      webViewLink,
      uploadId: uploadId || '',
      errorStage: 'supabase',
      message: 'File sudah tersimpan di Google Drive, tetapi metadata belum tersimpan'
    };
  }
}

/**
 * Helper utility for Google Drive file upload integration using Google Identity Services (GIS)
 * and Google Drive API v3 REST endpoints.
 */

export interface DriveUploadResult {
  id: string;
  webViewLink: string;
  name: string;
}

// Drive Folder IDs from Lazuardi School configuration
export const DRIVE_TARGET_FOLDERS = {
  CERTIFICATES: '1YONRvdVcMktQ5t2WOvI6KML2UM74KNlW',
  MATERIALS: '1E1LnuMEuosY9nsQUhY-zQyBGfZzpK1sY',
};

/**
 * Loads the Google Identity Services (GIS) SDK script if not already present.
 */
export function loadGsiClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window object unavailable'));
    }

    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Gagal memuat SDK Auth Google Drive')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat SDK Auth Google Drive'));
    document.body.appendChild(script);
  });
}

/**
 * Requests an OAuth 2.0 Access Token from the user for Google Drive scope.
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
  try {
    await loadGsiClient();
  } catch (err: any) {
    throw new Error('Gagal memuat pustaka Google Authentication. Pastikan koneksi internet stabil.');
  }

  return new Promise((resolve, reject) => {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        return reject(new Error('Layanan Google OAuth belum siap di browser. Silakan muat ulang halaman.'));
      }

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '108119056254-googleapplet.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        error_callback: (err: any) => {
          console.warn('OAuth Error:', err);
          reject(new Error(`Otorisasi Google ditolak atau jendela login ditutup.`));
        },
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`Otentikasi Google ditolak: ${response.error_description || response.error}`));
          } else if (response.access_token) {
            try {
              sessionStorage.setItem('lazuardi_drive_token', response.access_token);
            } catch (e) {
              // ignore quota/storage errors
            }
            resolve(response.access_token);
          } else {
            reject(new Error('Token akses tidak diterima dari Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(new Error(err?.message || 'Gagal membongkar pop-up otentikasi Google Drive.'));
    }
  });
}

/**
 * Uploads a file directly to a specified Google Drive folder ID using Google Drive API v3 multipart upload.
 */
export async function uploadFileToGoogleDriveFolder(
  file: File,
  folderId: string,
  providedToken?: string
): Promise<DriveUploadResult> {
  let token = providedToken || sessionStorage.getItem('lazuardi_drive_token');

  if (!token) {
    token = await getGoogleDriveAccessToken();
  }

  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', file);

  try {
    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (res.status === 401) {
      // Token expired, clear token and retry once
      sessionStorage.removeItem('lazuardi_drive_token');
      const newToken = await getGoogleDriveAccessToken();
      return uploadFileToGoogleDriveFolder(file, folderId, newToken);
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal upload ke Google Drive (Status ${res.status})`);
    }

    const data = await res.json();
    const webViewLink = data.webViewLink || `https://drive.google.com/file/d/${data.id}/view?usp=sharing`;

    return {
      id: data.id,
      webViewLink,
      name: data.name,
    };
  } catch (error: any) {
    console.error('Drive Upload Error:', error);
    throw error;
  }
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { listTrainings, upsertTraining, deleteTraining } from './server/trainingService.js';
import {
  createResumableUploadSession,
  findUploadedFileByUploadId,
  finalizeUploadAndSaveToSupabase,
  performIntegrationDiagnostics
} from './server/driveService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

export async function createServerApp() {
  const app = express();

  app.use(express.json());

  // Initialize Gemini AI Client lazily or safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({ apiKey });
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Arsip Pelatihan Guru SD Lazuardi Server' });
  });

  // Shared training archive stored in Supabase
  app.get('/api/trainings', async (_req, res) => {
    try {
      const records = await listTrainings();
      return res.json({ ok: true, records });
    } catch (error: any) {
      console.error('[Training List Error]', error?.message || error);
      return res.status(500).json({ ok: false, message: error?.message || 'Gagal membaca arsip pelatihan.' });
    }
  });

  app.post('/api/trainings', async (req, res) => {
    try {
      const record = req.body;
      if (!record?.id || !record?.teacherName || !record?.trainingName) {
        return res.status(400).json({ ok: false, message: 'Data arsip pelatihan belum lengkap.' });
      }
      const saved = await upsertTraining(record);
      return res.json({ ok: true, record: saved });
    } catch (error: any) {
      console.error('[Training Save Error]', error?.message || error);
      return res.status(500).json({ ok: false, message: error?.message || 'Gagal menyimpan arsip pelatihan.' });
    }
  });

  app.delete('/api/trainings/:id', async (req, res) => {
    try {
      await deleteTraining(req.params.id);
      return res.json({ ok: true, id: req.params.id });
    } catch (error: any) {
      console.error('[Training Delete Error]', error?.message || error);
      return res.status(500).json({ ok: false, message: error?.message || 'Gagal menghapus arsip pelatihan.' });
    }
  });

  // Check Drive & Supabase Server Config Status
  app.get('/api/drive/config-status', (req, res) => {
    const googleEmail = Boolean(process.env.GOOGLE_CLIENT_EMAIL);
    const googlePrivateKey = Boolean(process.env.GOOGLE_PRIVATE_KEY);
    const certFolder = Boolean(process.env.GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID);
    const matFolder = Boolean(process.env.GOOGLE_DRIVE_MATERIAL_FOLDER_ID);
    const supabaseUrl = Boolean(process.env.SUPABASE_URL);
    const supabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    const isFullyConfigured = googleEmail && googlePrivateKey && certFolder && matFolder && supabaseUrl && supabaseKey;

    res.json({
      configured: isFullyConfigured,
      details: {
        GOOGLE_CLIENT_EMAIL: googleEmail,
        GOOGLE_PRIVATE_KEY: googlePrivateKey,
        GOOGLE_DRIVE_CERTIFICATE_FOLDER_ID: certFolder,
        GOOGLE_DRIVE_MATERIAL_FOLDER_ID: matFolder,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
      }
    });
  });

  // Comprehensive Real Read-Only Integration Diagnostic
  app.get('/api/integration-health', async (req, res) => {
    try {
      const diagnostics = await performIntegrationDiagnostics();
      return res.json(diagnostics);
    } catch (error: any) {
      console.error('Integration Health Diagnostic Error:', error);
      return res.status(500).json({ error: error?.message || 'Gagal menjalankan pemeriksaan kesehatan integrasi.' });
    }
  });

  // Start Google Drive Resumable Upload Session
  app.post('/api/drive/create-resumable-upload', async (req, res) => {
    try {
      const { fileName, mimeType, fileSize, fileType, uploadId } = req.body;
      if (!fileName || !fileSize || !fileType) {
        return res.status(400).json({
          ok: false,
          driveUploaded: false,
          metadataSaved: false,
          errorStage: 'drive',
          message: 'Parameter upload tidak lengkap (fileName, fileSize, fileType wajib diisi).'
        });
      }

      const result = await createResumableUploadSession({ fileName, mimeType, fileSize, fileType, uploadId });
      return res.json({ ok: true, ...result });
    } catch (error: any) {
      console.error('[Drive Upload Error]', error?.message || error);
      return res.status(400).json({
        ok: false,
        driveUploaded: false,
        metadataSaved: false,
        errorStage: 'drive',
        message: error?.message || 'Gagal membuat sesi upload Google Drive.'
      });
    }
  });

  // Reconcile a direct browser upload whose Drive response could not be read.
  // Google Drive may have stored the file even when the browser reports a
  // network/CORS error. This endpoint searches by the idempotency uploadId.
  app.post('/api/drive/resolve-upload', async (req, res) => {
    try {
      const { uploadId, fileType } = req.body;
      if (!uploadId || !['certificate', 'material'].includes(fileType)) {
        return res.status(400).json({
          ok: false,
          found: false,
          message: 'Parameter resolve upload tidak lengkap.'
        });
      }

      const result = await findUploadedFileByUploadId({ uploadId, fileType });
      return res.json({ ok: true, ...result });
    } catch (error: any) {
      console.error('[Resolve Upload Error]', error?.message || error);
      return res.status(500).json({
        ok: false,
        found: false,
        message: error?.message || 'Gagal memeriksa file yang sudah terunggah.'
      });
    }
  });

  // Finalize Upload & Record to Supabase
  app.post('/api/drive/finalize-upload', async (req, res) => {
    try {
      const { fileId, fileName, mimeType, fileSize, fileType, trainingId, uploadId } = req.body;
      if (!fileId || !fileName || !fileType) {
        return res.status(400).json({
          ok: false,
          driveUploaded: false,
          metadataSaved: false,
          errorStage: 'drive',
          message: 'Parameter finalisasi tidak lengkap (fileId, fileName, fileType wajib diisi).'
        });
      }

      const result = await finalizeUploadAndSaveToSupabase({ fileId, fileName, mimeType, fileSize, fileType, trainingId, uploadId });
      return res.json(result);
    } catch (error: any) {
      console.error('[Finalize Error]', error?.message || error);
      return res.status(500).json({
        ok: false,
        driveUploaded: true,
        metadataSaved: false,
        errorStage: 'supabase',
        message: 'File sudah tersimpan di Google Drive, tetapi metadata belum tersimpan'
      });
    }
  });

  // AI Endpoint: Generate Action Plan and Key Points from Training Notes
  app.post('/api/generate-ai-plan', async (req, res) => {
    try {
      const { trainingName, notes, teacherRole, category } = req.body;

      if (!trainingName) {
        return res.status(400).json({ error: 'Nama pelatihan wajib diisi.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback simulated response if key is not configured yet
        return res.json({
          summary: `Pelatihan "${trainingName}" mendukung kompetensi ${category || 'pedagogik'} guru SD Lazuardi.`,
          actionPlan: [
            `Implementasi materi ${trainingName} di aktivitas kelas minggu ini.`,
            `Sosialisasi dan berbagi pengalaman singkat bersama sejawat tim guru.`,
            `Evaluasi berkala penerapan metode baru bersama koordinator kurikulum.`
          ]
        });
      }

      const ai = getGeminiClient();
      const prompt = `
Anda adalah konsultan pengembangan SDM Guru di SD Lazuardi (Sekolah Inklusi & Global Compassionate School).
Analisis pelatihan guru berikut dan berikan luaran JSON yang rapi:

Nama Pelatihan: ${trainingName}
Peran Guru: ${teacherRole || 'Guru SD Lazuardi'}
Kategori: ${category || 'Pedagogik'}
Catatan/Materi Dari Guru: ${notes || 'Tidak ada catatan khusus.'}

Tolong berikan respon dalam format JSON persis seperti berikut (tanpa markdown codeblock tambahan):
{
  "summary": "Satu kalimat rangkuman manfaat utama pelatihan ini untuk pembelajaran anak SD Lazuardi.",
  "actionPlan": [
    "Langkah aksi konkret 1 di kelas / sekolah",
    "Langkah aksi konkret 2 di kelas / sekolah",
    "Langkah aksi konkret 3 di kelas / sekolah"
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      // Parse JSON from output
      let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsedData;
      try {
        parsedData = JSON.parse(cleanText);
      } catch (err) {
        parsedData = {
          summary: responseText.slice(0, 150) + '...',
          actionPlan: [
            'Penerapan langsung konsep utama di kegiatan mengajar harian.',
            'Penyusunan laporan singkat hasil pelatihan untuk kepala sekolah.',
            'Pengimbasan materi kepada kolega guru dalam forum KKG sekolah.'
          ]
        };
      }

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      return res.status(500).json({
        error: error.message || 'Gagal menghasilkan Rencana Aksi AI.',
        fallbackSummary: 'Pelatihan ini bermanfaat untuk meningkatkan kualitas pengajaran di SD Lazuardi.',
        fallbackActionPlan: [
          'Penerapan langsung konsep utama di kegiatan mengajar harian.',
          'Penyusunan laporan singkat hasil pelatihan untuk kepala sekolah.',
          'Pengimbasan materi kepada kolega guru dalam forum KKG sekolah.'
        ]
      });
    }
  });

  // AI Endpoint: Recommend next trainings for teacher CPD
  app.post('/api/recommend-trainings', async (req, res) => {
    try {
      const { teacherName, role, completedTrainings } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          recommendations: [
            {
              title: 'Workshop Asesmen Formatif & Portofolio Siswa SD',
              category: 'Pedagogik',
              reason: 'Melengkapi kemampuan guru dalam mengukur capaian siswa secara holistik.'
            },
            {
              title: 'Pengembangan Media Pembelajaran Digital Berbasis Game (Gamifikasi)',
              category: 'Digital & IT Learning',
              reason: 'Meningkatkan keterlibatan aktif siswa dalam proses belajar.'
            },
            {
              title: 'Strategi Pendampingan Emosi dan Sosial Anak Usia Sekolah Dasar',
              category: 'Pengembangan Karakter & Islam',
              reason: 'Memperkuat peran guru sebagai fasilitator karakter Compassionate School.'
            }
          ]
        });
      }

      const ai = getGeminiClient();
      const prompt = `
Nama Guru: ${teacherName}
Jabatan/Peran: ${role}
Daftar Pelatihan Yang Sudah Diikuti: ${JSON.stringify(completedTrainings || [])}

Sebagai pakar pengembangan profesi guru di SD Lazuardi, rekomendasikan 3 judul pelatihan/workshop berikutnya yang relevan untuk meningkatkan profesionalisme guru ini.

Formatkan jawaban sebagai JSON valid (tanpa markdown codeblock):
{
  "recommendations": [
    {
      "title": "Judul Pelatihan 1",
      "category": "Kategori Pelatihan",
      "reason": "Alasan singkat mengapa pelatihan ini direkomendasikan"
    },
    ...
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsedData;
      try {
        parsedData = JSON.parse(cleanText);
      } catch (e) {
        parsedData = {
          recommendations: [
            {
              title: 'Asesmen Adaptif dalam Pembelajaran Diferensiasi SD',
              category: 'Pedagogik',
              reason: 'Meningkatkan kemampuan pemetaan minat dan gaya belajar murid.'
            },
            {
              title: 'Penggunaan Canva for Education & Video Interaktif Pembelajaran',
              category: 'Digital & IT Learning',
              reason: 'Menyajikan materi visual yang lebih menarik bagi generasi digital.'
            }
          ]
        };
      }

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Recommendation error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite Dev Server or Production Static Files
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Local development / standalone Node deployment. Vercel imports the app
// through api/index.ts and provides its own listener.
if (!process.env.VERCEL) {
  createServerApp()
    .then(app => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[SD Lazuardi Training Archive] Server is running on http://0.0.0.0:${PORT}`);
      });
    })
    .catch(error => {
      console.error('[Server Startup Error]', error);
      process.exitCode = 1;
    });
}

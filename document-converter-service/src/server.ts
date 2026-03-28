import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { convertToPdf, SupportedFormat } from './converter';
import { authenticateJWT } from './auth';
import { validateFile, getFormatFromExtension, SUPPORTED_EXTENSIONS } from './utils';
import { configureCors } from './cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors(configureCors()));
app.use(express.json());

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB limit
  },
});

// Health check endpoint (public - no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'document-converter-service' });
});

const handleConvert = (expectedFormat?: SupportedFormat) =>
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const format = expectedFormat ?? getFormatFromExtension(req.file.originalname);
      if (!format) {
        return res.status(400).json({
          error: `Unsupported file type. Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`
        });
      }

      const validation = validateFile(req.file, format);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      console.log(`[${format} Conversion] Starting - Size: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB`);

      const { pdf, metrics } = await convertToPdf(req.file.buffer, format);

      console.log(`[${format} Conversion] Success - Input: ${metrics.inputSizeMB}MB, Output: ${metrics.outputSizeMB}MB, Duration: ${metrics.durationMs}ms`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
      res.setHeader('X-Conversion-Duration', metrics.durationMs.toString());
      res.setHeader('X-Input-Size-MB', metrics.inputSizeMB);
      res.setHeader('X-Output-Size-MB', metrics.outputSizeMB);

      res.send(pdf);
    } catch (error) {
      console.error('[Conversion] Error:', error);
      res.status(500).json({
        error: 'Conversion failed',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  };

// Current endpoint — auto-detects format from file extension
app.post('/convert', authenticateJWT, upload.single('file'), handleConvert());

// @deprecated — legacy endpoints, use POST /convert instead
app.post('/convert/docx', authenticateJWT, upload.single('file'), handleConvert('DOCX'));
app.post('/convert/doc', authenticateJWT, upload.single('file'), handleConvert('DOC'));
app.post('/convert/pptx', authenticateJWT, upload.single('file'), handleConvert('PPTX'));
app.post('/convert/ppt', authenticateJWT, upload.single('file'), handleConvert('PPT'));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Document Converter Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});


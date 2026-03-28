import { SupportedFormat } from './converter';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const FORMAT_CONFIG: Record<SupportedFormat, { extensions: string[]; mimeTypes: string[] }> = {
  DOC: {
    extensions: ['doc'],
    mimeTypes: [
      'application/msword',
      'application/octet-stream',
    ],
  },
  DOCX: {
    extensions: ['docx'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ],
  },
  PPTX: {
    extensions: ['pptx'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',
    ],
  },
  PPT: {
    extensions: ['ppt'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/octet-stream',
    ],
  },
};

export const SUPPORTED_EXTENSIONS = Object.values(FORMAT_CONFIG).flatMap(c => c.extensions);

export const getFormatFromExtension = (filename: string): SupportedFormat | null => {
  const ext = filename.toLowerCase().split('.').pop();
  for (const [format, config] of Object.entries(FORMAT_CONFIG)) {
    if (config.extensions.includes(ext ?? '')) {
      return format as SupportedFormat;
    }
  }
  return null;
};

export const validateFile = (file: Express.Multer.File, format: SupportedFormat): ValidationResult => {
  const config = FORMAT_CONFIG[format];
  const extension = file.originalname.toLowerCase().split('.').pop();

  if (!config.extensions.includes(extension ?? '')) {
    return { valid: false, error: `File must have .${config.extensions.join(' or .')} extension` };
  }

  if (!config.mimeTypes.includes(file.mimetype)) {
    return { valid: false, error: `Invalid file type. Only ${format} files are allowed` };
  }

  return { valid: true };
};

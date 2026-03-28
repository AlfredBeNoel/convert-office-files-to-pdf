import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

export interface ConversionMetrics {
  inputSizeMB: string;
  outputSizeMB: string;
  durationMs: number;
}

export type SupportedFormat = 'DOC' | 'DOCX' | 'PPTX' | 'PPT';

export const convertToPdf = async (buffer: Buffer, format: SupportedFormat): Promise<{ pdf: Buffer; metrics: ConversionMetrics }> => {
  const startTime = Date.now();
  const inputSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
  
  try {
    const pdfBuffer = await convertAsync(buffer, '.pdf', undefined);
    const durationMs = Date.now() - startTime;
    const outputSizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
    
    return {
      pdf: pdfBuffer,
      metrics: {
        inputSizeMB,
        outputSizeMB,
        durationMs
      }
    };
  } catch (error) {
    throw new Error(`Failed to convert ${format} to PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};


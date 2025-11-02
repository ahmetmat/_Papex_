import { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { FileText } from 'lucide-react';

// Configure PDF.js worker - use worker from public folder to avoid CSP issues
// The worker file is copied to public/pdf.worker.min.mjs during build
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PDFPreview = ({ url }: { url: string }) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadPDFPreview = async () => {
      try {
        
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);
        
        const pdf = await pdfjs.getDocument({ data: typedarray }).promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        setPreview(canvas.toDataURL('image/jpeg', 0.8));
      } catch (error) {
        console.error('PDF preview generation error:', error);
      }
    };

    if (url) {
      loadPDFPreview();
    }
  }, [url]);

  return preview ? (
    <img 
      src={preview}
      alt="PDF Preview"
      className="w-full h-48 object-cover rounded shadow"
    />
  ) : (
    <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded shadow">
      <FileText className="w-12 h-12 text-gray-400" />
    </div>
  );
};

export default PDFPreview;
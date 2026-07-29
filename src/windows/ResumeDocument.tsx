import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Every react-pdf/pdf.js import lives in this module so the viewer ships as its
 * own chunk, fetched the first time the Resume window opens rather than on load.
 * Nothing else may import from here, or the chunk gets pulled back into the
 * main bundle — Resume.tsx owns the loading placeholder for that reason.
 */
const ResumeDocument = () => (
  <Document
    file="files/resume.pdf"
    loading={<div className="resume-loading">Loading resume…</div>}
  >
    <Page pageNumber={1} renderTextLayer renderAnnotationLayer />
  </Document>
);

export default ResumeDocument;

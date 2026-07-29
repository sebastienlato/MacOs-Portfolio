import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Served from our own origin rather than a CDN: the worker is what renders the
// page, so a blocked or unreachable unpkg used to mean a blank resume. `?url`
// makes Vite emit it as an asset and hand back its hashed path, which also
// keeps it locked to the pdfjs-dist version react-pdf was built against.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

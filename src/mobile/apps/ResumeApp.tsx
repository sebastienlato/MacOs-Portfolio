import { Suspense, lazy, useEffect, useState } from "react";
import { Download } from "lucide-react";

import AppFrame from "#mobile/AppFrame";

// Same split as the desktop: pdf.js is large and most visitors never open this
const ResumeDocument = lazy(() => import("#windows/ResumeDocument"));

/** Page gutter either side, matched to the app body's own padding. */
const GUTTER = 32;

const pageWidth = () => Math.min(window.innerWidth - GUTTER, 720);

const ResumeApp = () => {
  const [width, setWidth] = useState(pageWidth);

  // A rotation changes the page width, and pdf.js rasterises to whatever it
  // was told — so it has to be re-rendered rather than stretched
  useEffect(() => {
    const onResize = () => setWidth(pageWidth());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return (
    <AppFrame
      title="Resume"
      action={
        <a href="files/resume.pdf" download aria-label="Download resume">
          <Download size={19} />
        </a>
      }
    >
      <div className="resume-page">
        <Suspense
          fallback={<div className="resume-loading">Loading resume…</div>}
        >
          <ResumeDocument width={width} />
        </Suspense>
      </div>

      <a className="resume-download" href="files/resume.pdf" download>
        <Download size={16} />
        Download PDF
      </a>
    </AppFrame>
  );
};

export default ResumeApp;

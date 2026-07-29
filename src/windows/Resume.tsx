import { Suspense, lazy } from "react";
import WindowWrapper from "#hoc/WindowWrapper";
import { WindowControls } from "#components";
import { Download } from "lucide-react";

// pdf.js is a large dependency and most visitors never open the resume, so the
// viewer is split into its own chunk and fetched on first open.
const ResumeDocument = lazy(() => import("#windows/ResumeDocument"));

const Resume = () => {
  return (
    <>
      <div id="window-header">
        <WindowControls target="resume" />
        <h2>Resume.pdf</h2>

        <a
          href="files/resume.pdf"
          download
          className="cursor-pointer"
          title="Download resume"
        >
          <Download className="icon" />
        </a>
      </div>

      {/* Fallback matches the PDF's natural page size, so nothing reflows */}
      <Suspense fallback={<div className="resume-loading">Loading resume…</div>}>
        <ResumeDocument />
      </Suspense>
    </>
  );
};

const ResumeWindow = WindowWrapper(Resume, "resume");

export default ResumeWindow;

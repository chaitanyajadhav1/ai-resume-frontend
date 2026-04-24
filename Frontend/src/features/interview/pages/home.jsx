import React, { useState, useRef } from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useInterview";
import { useNavigate } from "react-router";

const MAX_JD = 5000;
const MAX_SELF = 2000;

const Home = () => {
  const { loading, loadingMessage, generateReport, reports } = useInterview();

  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState([]);

  const resumeInputRef = useRef(null);
  const navigate = useNavigate();

  // ✅ File select
  const handleFileSelect = (file) => {
    if (!file) return;
    setResumeFile(file);
  };

  // ✅ Drop handler
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file) {
      setResumeFile(file);
    }

    setIsDragOver(false);
  };

  // ✅ Generate Report with validation
  const handleGenerateReport = async () => {
    const newErrors = [];

    if (!jobDescription.trim()) {
      newErrors.push("Job description is required");
    }

    if (!resumeFile && !selfDescription.trim()) {
      newErrors.push(
        "Either a Resume or a Self Description is required"
      );
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setErrors([]);

      const data = await generateReport({
        jobDescription,
        selfDescription,
        resume: resumeFile,
      });

      console.log("NAV DATA:", data);

      navigate(`/interview/${data._id}`);
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className="interview-loading">
        <div className="loader-content">
          <div className="spinner"></div>
          <h1>{loadingMessage || "Generating Interview Report..."}</h1>
          <p>This may take a moment while our AI analyzes your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="home">
      {/* ── Header ── */}
      <header className="home-header">
        <h1>
          Create Your Custom <span>Interview Plan</span>
        </h1>
        <p>
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
      </header>

      {/* ── Main Card ── */}
      <div className="interview-card">

        {/* LEFT: Job Description */}
        <section className="section">
          <div className="section-header">
            <div className="section-title">
              <span className="icon">📋</span>
              <h2>Target Job Description</h2>
            </div>
            <span className="badge-required">Required</span>
          </div>

          <div className="textarea-wrap" style={{ flex: 1 }}>
            <textarea
              className="field"
              value={jobDescription}
              onChange={(e) =>
                setJobDescription(e.target.value.slice(0, MAX_JD))
              }
              placeholder={`Paste the full job description here...`}
              style={{ minHeight: "300px" }}
            />
            <span className="char-count">
              {jobDescription.length} / {MAX_JD} chars
            </span>
          </div>
        </section>

        {/* RIGHT: Profile */}
        <section className="section">
          <div className="section-header">
            <div className="section-title">
              <span className="icon">👤</span>
              <h2>Your Profile</h2>
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <div className="section-header" style={{ marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", color: "#8b949e", fontWeight: 500 }}>
                Upload Resume
              </span>
              <span className="badge-best">Best Results</span>
            </div>

            <div
              className={`upload-zone${isDragOver ? " drag-over" : ""}${resumeFile ? " has-file" : ""}`}
              onClick={() => resumeInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && resumeInputRef.current?.click()}
              aria-label="Upload resume"
            >
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.docx"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {resumeFile ? (
                <>
                  <div className="upload-icon">✅</div>
                  <p className="upload-main">File selected</p>
                  <p className="file-name">{resumeFile.name}</p>
                  <p className="upload-sub">Click to change</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">☁️</div>
                  <p className="upload-main">Click to upload or drag & drop</p>
                  <p className="upload-sub">PDF or DOCX (Max 5MB)</p>
                </>
              )}
            </div>
          </div>

          {/* OR Divider */}
          <div className="or-divider">OR</div>

          {/* Self Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
            <label
              style={{ fontSize: "0.82rem", color: "#8b949e", fontWeight: 500 }}
            >
              Quick Self-Description
            </label>
            <div className="textarea-wrap">
              <textarea
                className="field short"
                value={selfDescription}
                onChange={(e) =>
                  setSelfDescription(e.target.value.slice(0, MAX_SELF))
                }
                placeholder="Briefly describe your experience..."
              />
              <span className="char-count">
                {selfDescription.length} / {MAX_SELF}
              </span>
            </div>
          </div>

          {/* Info Banner */}
          <div className="info-banner">
            <span className="dot" />
            <p>
              Either a <strong>Resume</strong> or a <strong>Self Description</strong> is
              required to generate a personalized plan.
            </p>
          </div>

          {/* ✅ Errors (FIXED) */}
          {errors.length > 0 && (
            <ul className="error-list">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </section>


        {/*recenet Report list*/}
        <section className="section">
          <div className="section-header">
            <div className="section-title">
              <span className="icon">📋</span>
              <h2>Recent Reports</h2>
            </div>
             <button
            className={`btn-generate${loading ? " loading" : ""}`}
            onClick={handleGenerateReport}
            disabled={loading}
          >
            <span className="btn-icon">{loading ? "⏳" : "✦"}</span>
            {loading ? "Generating..." : "Generate My Interview Strategy"}
          </button>
          </div>
          
          <div className="report-list">
            {reports.map((report) => {
              const scoreClass = report.matchScore >= 80 ? "excellent" : report.matchScore >= 60 ? "good" : "low";
              return (
                <div
                  key={report._id}
                  className="report-item"
                  onClick={() => navigate(`/interview/${report._id}`)}
                >
                  <div className="report-title">{report.title}</div>
                  <div className="report-date">{new Date(report.createdAt).toLocaleDateString()}</div>
                  <p className={`match-score ${scoreClass}`}>{report.matchScore}%</p>
                </div>
              );
            })}
          </div>
        </section>
        {/* Footer */}
        <footer className="card-footer">
          <p className="footer-meta">
            <span>AI-Powered Strategy Generation</span> • Approx 30s
          </p>
          {/* <button
            className={`btn-generate${loading ? " loading" : ""}`}
            onClick={handleGenerateReport}
            disabled={loading}
          >
            <span className="btn-icon">{loading ? "⏳" : "✦"}</span>
            {loading ? "Generating..." : "Generate My Interview Strategy"}
          </button> */}
        </footer>
      </div>

      {/* Footer Links */}
      <nav className="page-footer">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/help">Help Center</a>
      </nav>
    </main>
  );
};

export default Home;
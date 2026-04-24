// ─── Interview Report Component ─────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import "../style/interview.scss";
import { useInterview } from "../hooks/useInterview"

import { useNavigate, useParams } from "react-router"
/* ── Hardcoded Report Data ── */


/* ── Section Definitions ── */
const SECTIONS = [
  { id: "technical", label: "Technical Questions", icon: "⟨⟩" },
  { id: "behavioral", label: "Behavioral Questions", icon: "🗣" },
  { id: "roadmap", label: "Road Map", icon: "🗺" },
];

/* ── Severity Colors ── */
const severityColor = {
  high: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#f87171" },
  medium: { bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.35)", text: "#fbbf24" },
  low: { bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.35)", text: "#34d399" },
};

/* ── Match Score Ring ── */
const ScoreRing = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring-wrap">
      <svg viewBox="0 0 128 128" className="score-ring-svg">
        <circle cx="64" cy="64" r={radius} className="ring-bg" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          className="ring-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-value">
        <span className="score-number">{score}</span>
        <span className="score-percent">%</span>
      </div>
    </div>
  );
};

/* ── Question Card ── */
const QuestionCard = ({ index, data, isExpanded, onToggle }) => (
  <div className={`question-card${isExpanded ? " expanded" : ""}`}>
    <button className="question-header" onClick={onToggle}>
      <div className="q-label">
        <span className="q-number">Q{index + 1}</span>
        <span className="q-text">{data.question}</span>
      </div>
      <span className="q-chevron">{isExpanded ? "‹" : "›"}</span>
    </button>

    {isExpanded && (
      <div className="question-body">
        <div className="q-block">
          <span className="q-badge intention">INTENTION</span>
          <p>{data.intention}</p>
        </div>
        <div className="q-block">
          <span className="q-badge model-answer">MODEL ANSWER</span>
          <p>{data.answer}</p>
        </div>
      </div>
    )}
  </div>
);

/* ── Day Card ── */
const DayCard = ({ plan, isExpanded, onToggle }) => (
  <div className={`day-card${isExpanded ? " expanded" : ""}`}>
    <button className="day-header" onClick={onToggle}>
      <div className="day-label">
        <span className="day-badge">Day {plan.day}</span>
        <span className="day-focus">{plan.focus}</span>
      </div>
      <span className="q-chevron">{isExpanded ? "‹" : "›"}</span>
    </button>

    {isExpanded && (
      <div className="day-body">
        <ul>
          {plan.tasks.map((task, i) => (
            <li key={i}>{task}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

/* ── Main Interview Component ── */
const Interview = () => {
  const [activeSection, setActiveSection] = useState("technical");
  const [expandedQ, setExpandedQ] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const { report, getReportById, loading, loadingMessage, getResumePdf } = useInterview()
  const { interviewId } = useParams()



  // ✅ ADD THIS BLOCK HERE
  if (loading || !report) {
    return (
      <div className="interview-loading">
        <div className="loader-content">
          <div className="spinner"></div>
          <h1>{loadingMessage || "Analyzing Report Data..."}</h1>
          <p>Preparing your personalized interview strategy</p>
        </div>
      </div>
    );
  }
  const questions =
    activeSection === "technical"
      ? report.technicalQuestions
      : report.behavioralQuestions;

  const sectionTitle =
    activeSection === "technical"
      ? "Technical Questions"
      : activeSection === "behavioral"
        ? "Behavioral Questions"
        : "Preparation Road Map";

  const questionCount =
    activeSection === "roadmap"
      ? `${report.preparationPlan.length} days`
      : `${questions.length} questions`;

  return (
    <main className="interview-page">
      {/* ── Left Sidebar ── */}
      <aside className="sidebar">
        <h3 className="sidebar-title">SECTIONS</h3>
        <nav className="sidebar-nav">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              className={`sidebar-btn${activeSection === sec.id ? " active" : ""}`}
              onClick={() => {
                setActiveSection(sec.id);
                setExpandedQ(null);
                setExpandedDay(null);
              }}
            >
              <span className="sidebar-icon">{sec.icon}</span>
              {sec.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" style={{ flex: 1 }}></div>

        <button
          onClick={() => { getResumePdf(interviewId) }}
          className="btn-download"
        >
          <span className="btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </span>
          Download Resume
        </button>
      </aside>

      {/* ── Center Content ── */}
      <section className="center-content">
        <div className="section-heading">
          <h2>{sectionTitle}</h2>
          <span className="question-count">{questionCount}</span>
        </div>

        {activeSection !== "roadmap" ? (
          <div className="questions-list">
            {questions.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                data={q}
                isExpanded={expandedQ === i}
                onToggle={() => setExpandedQ(expandedQ === i ? null : i)}
              />
            ))}
          </div>
        ) : (
          <div className="roadmap-list">
            {report.preparationPlan.map((plan, i) => (
              <DayCard
                key={i}
                plan={plan}
                isExpanded={expandedDay === i}
                onToggle={() => setExpandedDay(expandedDay === i ? null : i)}
              />
            ))}
          </div>
        )}

      </section>

      {/* ── Right Panel ── */}
      <aside className="right-panel">
        {/* Match Score */}
        <div className="panel-card score-card">
          <h4 className="panel-label">MATCH SCORE</h4>
          <ScoreRing score={report.matchScore} />
          <p className="score-caption">Strong match for this role</p>
        </div>

        {/* Skill Gaps */}
        <div className="panel-card gaps-card">
          <h4 className="panel-label">SKILL GAPS</h4>
          <div className="gaps-list">
            {report.skillGaps.map((gap, i) => {
              const colors = severityColor[gap.severity] || severityColor.medium;
              return (
                <div
                  key={i}
                  className="gap-chip"
                  style={{
                    background: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  {gap.skill}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </main>
  );
};

export default Interview;




import { useState, useEffect, useCallback } from "react";



import {



  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen,



  CalendarDays, ChevronDown, CircleHelp, GraduationCap,



  LayoutDashboard, Menu, Search, Settings, ShieldAlert, Target,



  Users, X, BriefcaseBusiness, CheckCircle2, MoreHorizontal



} from "lucide-react";



import {



 ResponsiveContainer, Tooltip, XAxis, YAxis,



BarChart, Bar, Cell, CartesianGrid



} from "recharts";



import {



  getApiHealth,



  getAnalyticsSummary,



  getStudents,



  getMlResults,



} from "./api";



import "./App.css";







const navigation = [



  { title: "OVERVIEW", items: [



    { label: "Dashboard", icon: LayoutDashboard },



    { label: "Students", icon: Users },



  ]},



  { title: "ANALYTICS", items: [



    { label: "Academic Insights", icon: BookOpen },



    { label: "Learning Engagement", icon: Activity },



    { label: "Methodology", icon: Settings },



  ]},



];







const pageDescriptions = {



  Dashboard: "Evidence-based insights from anonymized learning records.",



  Students: "Explore student-course records and their academic indicators.",



  "Academic Insights": "Explore historical assessment outcomes and results.",



  "Learning Engagement": "Understand online learning activity and engagement.",



  Methodology: "Understand the indicators, model evaluation, and limitations behind CampusIQ.",



};







const riskOptions = [



  { value: "all", label: "All indicators" },



  { value: "At risk", label: "At risk" },



  { value: "Lower risk", label: "Lower risk" },



  { value: "Insufficient assessment data", label: "Insufficient data" },



];







const outcomeColors = {



  Pass: "#55a88b",



  Distinction: "#3978e8",



  Fail: "#e58b65",



  Withdrawn: "#9ba6b7",



};







function MetricCard({ label, value, icon: Icon, tone, caption }) {



  return (



    <article className="metric-card">



      <div className="metric-top">



        <span className="metric-label">{label}</span>



        <span className={`metric-icon ${tone}`}>



          <Icon size={18} strokeWidth={1.8} />



        </span>



      </div>



      <div className="metric-value">{value}</div>



      <div className="metric-bottom">



        <span className="metric-caption">{caption}</span>



      </div>



    </article>



  );



}







function formatNumber(value) {



  return Number(value || 0).toLocaleString("en-IN");



}







function formatScore(value) {



  return value == null || value === "" ? "—" : Number(value).toFixed(1);



}







function App() {



  const [activePage, setActivePage] = useState("Dashboard");



    const currentPageTitle = activePage === "Dashboard" ? "Good morning, Admin" : activePage;



const [search, setSearch] = useState("");



  const [riskFilter, setRiskFilter] = useState("all");



  const [menuOpen, setMenuOpen] = useState(false);



  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);







  const [apiStatus, setApiStatus] = useState("checking");



  const [summary, setSummary] = useState(null);



  const [studentsResponse, setStudentsResponse] = useState(null);



  const [mlResults, setMlResults] = useState(null);



  const [loading, setLoading] = useState(true);



  const [apiError, setApiError] = useState("");







  const loadDashboard = useCallback(async () => {



    setLoading(true);



    setApiError("");







    try {



const [summaryResult, studentsResult, mlResult] = await Promise.all([



  getAnalyticsSummary(),



  getStudents({



    search,



    risk: riskFilter,



    limit: 100,



    offset: 0,



  }),



  getMlResults(),



]);







setSummary(summaryResult);



setStudentsResponse(studentsResult);



setMlResults(mlResult.results || null);



      setApiStatus("connected");



    } catch (error) {



      setApiStatus("disconnected");



      setApiError(error.message || "Could not load dashboard data.");



    } finally {



      setLoading(false);



    }



  }, [search, riskFilter]);







  useEffect(() => {



    getApiHealth()



      .then(() => setApiStatus("connected"))



      .catch(() => setApiStatus("disconnected"));



  }, []);







  useEffect(() => {



    loadDashboard();



  }, [loadDashboard]);







  const outcomeData = Object.entries(summary?.outcomes || {})



    .map(([name, value]) => ({



      name,



      count: Number(value),



      fill: outcomeColors[name] || "#3978e8",



    }))



    .sort((a, b) => b.count - a.count);







  const riskDistribution = summary?.risk_distribution || {};



  const students = studentsResponse?.students || [];







  const atRiskCount = Number(riskDistribution["At risk"] || 0);



  const insufficientCount = Number(



    riskDistribution["Insufficient assessment data"] || 0



  );







  const scoreAvailableCount =



    Number(summary?.total_records || 0) -



    Number(summary?.records_without_scores || 0);







  return (



    <div className="app-shell">



      {menuOpen && (



        <button



          className="mobile-overlay"



          aria-label="Close navigation"



          onClick={() => setMenuOpen(false)}



        />



      )}







      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>



        <div className="brand">



          <div className="brand-mark">



            <Activity size={23} strokeWidth={2.4} />



          </div>



          <div>



            <div className="brand-name">campusiq<span>.</span></div>



            <div className="brand-caption">CAMPUS INTELLIGENCE</div>



          </div>



          <button



            className="mobile-close"



            onClick={() => setMenuOpen(false)}



            aria-label="Close menu"



          >



            <X size={19} />



          </button>



        </div>







        <div className="workspace-label">WORKSPACE</div>







        {navigation.map((group) => (



          <div className="nav-group" key={group.title}>



            <div className="nav-heading">{group.title}</div>



            {group.items.map(({ label, icon: Icon }) => (



              <button



                key={label}



                className={`nav-item ${activePage === label ? "active" : ""}`}



                onClick={() => {



                  setActivePage(label);



                  setMenuOpen(false);



                }}



              >



                <Icon size={18} strokeWidth={1.8} />



                <span>{label}</span>



                {label === "Students" && summary && (



                  <span className="nav-count">



                    {formatNumber(summary.total_records)}



                  </span>



                )}



              </button>



            ))}



          </div>



        ))}







        <div className="sidebar-spacer" />







        <div className="sidebar-note">



          <div className="note-icon"><ShieldAlert size={17} /></div>



          <div>



            <div className="note-title">Early support matters</div>



            <p>Use student indicators to guide timely, supportive interventions.</p>



          </div>



        </div>







        <button



          className="nav-item settings-item"



          onClick={() => setShowScoreInfo(true)}



        >



          <Settings size={18} /><span>Methodology</span>



        </button>







        <div className="profile">



          <div className="profile-avatar">AD</div>



          <div className="profile-info">



            <strong>Campus Admin</strong>



            <span>Administrator</span>



          </div>



          <MoreHorizontal size={19} className="profile-more" />



        </div>



      </aside>







      <main className="main-content">



        <header className="topbar">



          <div className="breadcrumbs">



            <button



              className="menu-toggle"



              onClick={() => setMenuOpen(true)}



              aria-label="Open navigation"



            >



              <Menu size={21} />



            </button>



            <span>Workspace</span>



            <span className="breadcrumb-slash">/</span>



            <strong>{activePage}</strong>



          </div>







          <div className="topbar-right">



            <div className={`demo-indicator api-indicator ${apiStatus}`}>



              <span />



              {apiStatus === "connected" && "API connected"}



              {apiStatus === "checking" && "Checking API..."}



              {apiStatus === "disconnected" && "API disconnected"}



            </div>



            <button



              className="help-button"



              title="Methodology"



              onClick={() => setShowScoreInfo(true)}



            >



              <CircleHelp size={19} />



            </button>



            <div className="top-avatar">CA</div>



          </div>



        </header>







        <div className="page-container">



          <section className="page-heading">



            <div>



              <div className="eyebrow">



                <span className="eyebrow-line" /> CAMPUS OVERVIEW



              </div>



              <h1>{currentPageTitle}<span className="heading-period">.</span></h1>



              <p>{pageDescriptions[activePage]}</p>



            </div>



            <div className="heading-actions">



              <button
                className="date-button"
                title="View dataset information"
                onClick={() => setActivePage("Methodology")}
              >



                <CalendarDays size={16} /> OULAD historical data



                <ChevronDown size={15} />



              </button>



              <button



                className="primary-button"



                onClick={() => setActivePage("Students")}



              >



                <Users size={16} /> View students



              </button>



            </div>



          </section>







          {activePage === "Dashboard" ? (



            <>



          <div className="demo-banner">



            <div className="demo-banner-icon"><Activity size={17} /></div>



            <div>



              <strong>Research dataset connected</strong>



              <span>



                Anonymized OULAD historical records. These are not live records



                from your college.



              </span>



            </div>



            <span className="banner-tag">OULAD DATA</span>



          </div>







          {apiError && (



            <div className="section-context">



              <div>



                <strong>Could not load data</strong>



                <p>{apiError}</p>



              </div>



              <button className="text-button" onClick={loadDashboard}>



                Retry <ArrowRight size={15} />



              </button>



            </div>



          )}



          <section className="metrics-grid">



            <MetricCard



              label="Student-course records"



              value={loading && !summary ? "…" : formatNumber(summary?.total_records)}



              icon={Users}



              tone="blue"



              caption="Historical course registrations"



            />



            <MetricCard



              label="Average Success Score"



              value={summary?.average_success_score == null



                ? "—"



                : `${formatScore(summary.average_success_score)}/100`}



              icon={Target}



              tone="green"



              caption="Proposed, unvalidated indicator"



            />



            <MetricCard



              label="Academic risk flags"



              value={loading && !summary ? "…" : formatNumber(atRiskCount)}



              icon={ShieldAlert}



              tone="orange"



              caption="Assessment mean below 40"



            />



            <MetricCard



              label="Missing assessment scores"



              value={loading && !summary ? "…" : formatNumber(insufficientCount)}



              icon={BookOpen}



              tone="purple"



              caption="Requires additional evidence"



            />



          </section>







          <section className="analytics-grid">



            <article className="panel performance-panel">



              <div className="panel-heading">



                <div>&#x20;



                  <div className="panel-kicker">HISTORICAL OUTCOMES</div>



                  <h2>Course result distribution</h2>



                  <p>Final outcomes recorded in the OULAD dataset</p>



                </div>



                <button



                  className="icon-button"



                  title="Methodology"



                  onClick={() => setShowScoreInfo(true)}



                >



                  <MoreHorizontal size={20} />



                </button>



              </div>







              <div className="chart-legend">



                <span className="legend-dot" /> Course records



              </div>







             <div className="performance-chart" style={{ width: "100%", height: 320, minHeight: 320 }}>



                <ResponsiveContainer width="100%" height="100%">



                  <BarChart



                    data={outcomeData}



                    margin={{ top: 10, right: 8, left: -12, bottom: 0 }}



                  >



                    <CartesianGrid stroke="#edf0f4" vertical={false} />



                    <XAxis



                      dataKey="name"



                      axisLine={false}



                      tickLine={false}



                      tick={{ fill: "#8a94a6", fontSize: 11 }}



                    />



                    <YAxis



                      axisLine={false}



                      tickLine={false}



                      tick={{ fill: "#8a94a6", fontSize: 11 }}



                    />



                    <Tooltip



                      contentStyle={{



                        borderRadius: 10,



                        border: "1px solid #e8ebf0",



                        fontSize: 12,



                      }}



                      formatter={(value) => [formatNumber(value), "Records"]}



                    />



                    <Bar



  dataKey="count"



  fill="#3978e8"



  radius={[4, 4, 0, 0]}



/>



                  </BarChart>



                </ResponsiveContainer>



              </div>



<div style={{



  display: "flex",



  alignItems: "flex-end",



  gap: 16,



  height: 220,



  padding: "20px 10px"



}}>



  {outcomeData.map(item => (



    <div key={item.name} style={{



      flex: 1,



      textAlign: "center"



    }}>



      <div style={{



        height: `${(item.count / Math.max(...outcomeData.map(o => o.count))) * 170}px`,



        background: item.fill,



        borderRadius: "5px 5px 0 0",



        minHeight: 4



      }} />



      <small>{item.name}</small>



    </div>



  ))}



</div>







              <div className="chart-foot">



                <span><span className="foot-dot" /> Historical course outcomes</span>



                <span>{formatNumber(summary?.total_records)} records</span>



              </div>



            </article>







            <article className="panel attendance-panel">



              <div className="panel-heading">



                <div>



                  <div className="panel-kicker">OUTCOME SNAPSHOT</div>



                  <h2>Final results</h2>



                  <p>Count by recorded course outcome</p>



                </div>



                <button



                  className="icon-button"



                  title="View academic insights"



                  onClick={() => setActivePage("Academic Insights")}



                >



                  <ArrowRight size={18} />



                </button>



              </div>







              <div className="attendance-stat">



                <strong>{formatNumber(summary?.outcomes?.Pass)}</strong>



                <span className="attendance-chip">Pass</span>



              </div>







              <div className="outcome-list">



                {outcomeData.map((item) => (



                  <div className="factor-row" key={item.name}>



                    <span



                      className="status-dot"



                      style={{ background: item.fill }}



                    />



                    <span>{item.name}</span>



                    <strong>{formatNumber(item.count)}</strong>



                  </div>



                ))}



              </div>







              <div className="attendance-footer">



                <span className="status-dot green-dot" />



                Historical outcomes, not predictions



              </div>



            </article>



          </section>







          <section className="lower-grid">



            <article className="panel students-panel">



              <div className="panel-heading students-heading">



                <div>



                  <div className="panel-kicker">STUDENT SUCCESS</div>



                  <h2>Student-course records</h2>



                  <p>Anonymized identifiers and available indicators</p>



                </div>



                <button



                  className="text-button"



                  onClick={() => setActivePage("Students")}



                >



                  Student view <ArrowRight size={15} />



                </button>



              </div>







              <div className="table-controls">



                <div className="search-box">



                  <Search size={16} />



                  <input



                    aria-label="Search student or course"



                    placeholder="Search ID or course..."



                    value={search}



                    onChange={(event) => setSearch(event.target.value)}



                  />



                </div>



                <select



                  aria-label="Filter by risk"



                  value={riskFilter}



                  onChange={(event) => setRiskFilter(event.target.value)}



                >



                  {riskOptions.map((option) => (



                    <option key={option.value} value={option.value}>



                      {option.label}



                    </option>



                  ))}



                </select>



              </div>







              <div className="table-scroll">



                <table className="student-table">



                  <thead>



                    <tr>



                      <th>STUDENT / COURSE</th>



                      <th>LMS CLICKS</th>



                      <th>SUCCESS SCORE</th>



                      <th>INDICATOR</th>



                    </tr>



                  </thead>



                  <tbody>



                    {students.map((student) => {



                      const riskClass = student.academic_risk === "At risk"



                        ? "high"



                        : student.academic_risk === "Lower risk"



                          ? "low"



                          : "medium";







                      return (



                        <tr



                          key={`${student.id_student}-${student.code_module}-${student.code_presentation}`}



                        >



                          <td>



                            <div className="student-identity">



                              <div className={`student-avatar ${riskClass}`}>



                                {String(student.id_student).slice(-2)}



                              </div>



                              <div>



                                <strong>ID {student.id_student}</strong>



                                <span>



                                  {student.code_module} · {student.code_presentation}



                                </span>



                              </div>



                            </div>



                          </td>



                          <td>



                            <div className="attendance-cell">



                              <strong>{formatNumber(student.total_lms_clicks)}</strong>



                              <span className="metric-caption">total clicks</span>



                            </div>



                          </td>



                          <td>



                            <div className="score-cell">



                              <strong>{formatScore(student.success_score)}</strong>



                              <span>/100</span>



                            </div>



                          </td>



                          <td>



                            <span className={`risk-badge ${riskClass}`}>



                              <span />



                              {student.academic_risk}



                            </span>



                          </td>



                        </tr>



                      );



                    })}







                    {!loading && students.length === 0 && (



                      <tr>



                        <td colSpan="4" className="empty-state">



                          No records match these filters.



                        </td>



                      </tr>



                    )}







                    {loading && (



                      <tr>



                        <td colSpan="4" className="empty-state">



                          Loading student records…



                        </td>



                      </tr>



                    )}



                  </tbody>



                </table>



              </div>







              <div className="table-footer">



                <span>



                  Showing {students.length} of{" "}



                  {formatNumber(studentsResponse?.total)} matching records



                </span>



                <span className="table-footer-right">



                  <CheckCircle2 size={14} /> OULAD records



                </span>



              </div>



            </article>







            <article className="panel score-panel">



              <div className="panel-heading">



                <div>



                  <div className="panel-kicker">TRANSPARENT ANALYTICS</div>



                  <h2>Success Score</h2>



                  <p>Proposed academic and engagement indicator</p>



                </div>



                <button



                  className="icon-button"



                  title="Score methodology"



                  onClick={() => setShowScoreInfo(true)}



                >



                  <CircleHelp size={18} />



                </button>



              </div>







              <div className="score-feature">



                <div className="score-gauge">



                  <svg



                    viewBox="0 0 120 120"



                    role="img"



                    aria-label="Average proposed Success Score"



                  >



                    <circle



                      cx="60" cy="60" r="48"



                      fill="none" stroke="#edf1f7" strokeWidth="9"



                    />



                    <circle



                      cx="60" cy="60" r="48"



                      fill="none" stroke="#3978e8" strokeWidth="9"



                      strokeLinecap="round"



                      strokeDasharray={`${Math.min(100, Math.max(0, Number(summary?.average_success_score || 0))) * 3.02} 302`}



                      transform="rotate(-90 60 60)"



                    />



                  </svg>



                  <div className="gauge-label">



                    <strong>{formatScore(summary?.average_success_score)}</strong>



                    <span>out of 100</span>



                  </div>



                </div>



                <div className="score-description">



                  <span className="sample-label">PROPOSED INDICATOR</span>



                  <h3>Average Success Score</h3>



                  <p>



                    Combines assessment mean and relative LMS engagement.



                    It is not a validated prediction of future success.



                  </p>



                  <button



                    className="text-button"



                    onClick={() => setShowScoreInfo(true)}



                  >



                    How it works <ArrowRight size={14} />



                  </button>



                </div>



              </div>







              <div className="score-factors">



                <div className="factor-row">



                  <span className="factor-icon factor-blue">



                    <BookOpen size={15} />



                  </span>



                  <span>Assessment mean</span>



                  <strong>60%</strong>



                </div>



                <div className="factor-row">



                  <span className="factor-icon factor-purple">



                    <Activity size={15} />



                  </span>



                  <span>Cohort engagement percentile</span>



                  <strong>40%</strong>



                </div>



              </div>







              <div className="score-disclaimer">



                <CircleHelp size={15} />



                <span>



                  {formatNumber(scoreAvailableCount)} records have usable



                  assessment scores. The formula is proposed, not validated.



                </span>



              </div>



            </article>



          </section>







            </>



          ) : (



            <>



              {activePage === "Students" && (



                <section className="panel students-panel" style={{ padding: 24, marginTop: 24 }}>



                  <div className="panel-heading students-heading">



                    <div><div className="panel-kicker">STUDENT DIRECTORY</div><h2>Student-course records</h2><p>Search anonymized learners and review available academic indicators.</p></div>



                    <span className="table-footer-right"><CheckCircle2 size={14} /> OULAD records</span>



                  </div>



                  <div className="table-controls">



                    <div className="search-box"><Search size={16} /><input aria-label="Search student or course" placeholder="Search ID or course..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>



                    <select aria-label="Filter by risk" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>{riskOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>



                  </div>



                  <div className="table-scroll">



                    <table className="student-table">



                      <thead><tr><th>STUDENT / COURSE</th><th>LMS CLICKS</th><th>SUCCESS SCORE</th><th>INDICATOR</th></tr></thead>



                      <tbody>



                        {students.map((student) => {



                          const riskClass = student.academic_risk === "At risk" ? "high" : student.academic_risk === "Lower risk" ? "low" : "medium";



                          return <tr key={`${student.id_student}-${student.code_module}-${student.code_presentation}`} onClick={() => setSelectedStudent(student)} title="Click to view student-course details" style={{ cursor: "pointer" }} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedStudent(student); }}><td><div className="student-identity"><div className={`student-avatar ${riskClass}`}>{String(student.id_student).slice(-2)}</div><div><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedStudent(student); }} style={{ padding: 0, border: 0, background: "transparent", color: "#1f2937", font: "inherit", fontWeight: 600, textAlign: "left", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>ID {student.id_student}</button><span>{student.code_module} · {student.code_presentation}</span></div></div></td><td><div className="attendance-cell"><strong>{formatNumber(student.total_lms_clicks)}</strong><span className="metric-caption">total clicks</span></div></td><td><div className="score-cell"><strong>{formatScore(student.success_score)}</strong><span>/100</span></div></td><td><span className={`risk-badge ${riskClass}`}><span />{student.academic_risk}</span></td></tr>;



                        })}



                        {!loading && students.length === 0 && <tr><td colSpan="4" className="empty-state">No records match these filters.</td></tr>}



                        {loading && <tr><td colSpan="4" className="empty-state">Loading student records…</td></tr>}



                      </tbody>



                    </table>



                  </div>



                  <div className="table-footer"><span>Showing {students.length} of {formatNumber(studentsResponse?.total)} matching records</span><span className="table-footer-right"><CheckCircle2 size={14} /> Filtered results</span></div>



                </section>



              )}







              {activePage === "Academic Insights" && (



                <>



                  <section className="metrics-grid" style={{ marginTop: 24 }}>



                    <MetricCard label="Pass outcomes" value={formatNumber(summary?.outcomes?.Pass)} icon={GraduationCap} tone="green" caption="Recorded final outcomes" />



                    <MetricCard label="Distinctions" value={formatNumber(summary?.outcomes?.Distinction)} icon={Target} tone="blue" caption="Recorded distinction outcomes" />



                    <MetricCard label="Failed outcomes" value={formatNumber(summary?.outcomes?.Fail)} icon={BookOpen} tone="orange" caption="Recorded final outcomes" />



                    <MetricCard label="Withdrawals" value={formatNumber(summary?.outcomes?.Withdrawn)} icon={ShieldAlert} tone="purple" caption="Recorded course withdrawals" />



                  </section>



                  <section className="analytics-grid" style={{ marginTop: 24 }}>



                    <article className="panel performance-panel">



                      <div className="panel-heading"><div><div className="panel-kicker">ACADEMIC PERFORMANCE</div><h2>Course result distribution</h2><p>Final outcomes in the historical OULAD dataset</p></div></div>



                      <div style={{ width: "100%", minHeight: 320, padding: "22px 8px 8px", display: "flex", alignItems: "flex-end", gap: 18, boxSizing: "border-box" }}>

                          {outcomeData.length ? outcomeData.map((item) => {

                            const maxOutcome = Math.max(1, ...outcomeData.map((entry) => entry.count));

                            return <div key={item.name} title={`${item.name}: ${formatNumber(item.count)} records`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: 270, gap: 10 }}>

                              <strong style={{ fontSize: 12, color: "#344054", fontWeight: 600 }}>{formatNumber(item.count)}</strong>

                              <div style={{ width: "min(100%, 76px)", height: `${Math.max(5, item.count / maxOutcome * 205)}px`, background: item.fill, borderRadius: "7px 7px 2px 2px", transition: "height .25s ease" }} />

                              <span style={{ fontSize: 12, color: "#748094", textAlign: "center" }}>{item.name}</span>

                            </div>;

                          }) : <p style={{ color: "#748094" }}>Outcome data is not available yet.</p>}

                        </div>



                    </article>



                    <article className="panel"><div className="panel-heading"><div><div className="panel-kicker">ASSESSMENT COVERAGE</div><h2>Data availability</h2><p>Availability of assessment evidence</p></div></div><div className="factor-row"><span>Records with scores</span><strong>{formatNumber(scoreAvailableCount)}</strong></div><div className="factor-row"><span>Missing assessment scores</span><strong>{formatNumber(insufficientCount)}</strong></div><p style={{ marginTop: 18, fontSize: 12, color: "#748094" }}>Missing scores are not treated as zero. Outcomes describe historical records and do not establish causation.</p></article>



                  </section>



                </>



              )}







              {activePage === "Learning Engagement" && (



                <>



                  <section className="metrics-grid" style={{ marginTop: 24 }}>



                    <MetricCard label="Records in view" value={formatNumber(studentsResponse?.total)} icon={Users} tone="blue" caption="Current filtered course records" />



                    <MetricCard label="Total LMS clicks" value={formatNumber(students.reduce((total, student) => total + Number(student.total_lms_clicks || 0), 0))} icon={Activity} tone="green" caption="Across loaded records" />



                    <MetricCard label="Highest clicks in view" value={formatNumber(students.reduce((max, student) => Math.max(max, Number(student.total_lms_clicks || 0)), 0))} icon={ArrowUpRight} tone="purple" caption="Among loaded records" />



                    <MetricCard label="Insufficient data flags" value={formatNumber(insufficientCount)} icon={ShieldAlert} tone="orange" caption="Requires additional evidence" />



                  </section>



                  <section className="panel students-panel" style={{ padding: 24, marginTop: 24 }}>



                    <div className="panel-heading"><div><div className="panel-kicker">ONLINE LEARNING ACTIVITY</div><h2>LMS engagement by student-course</h2><p>LMS clicks measure recorded online activity, not physical attendance or learning quality.</p></div></div>



                    <div className="table-scroll"><table className="student-table"><thead><tr><th>STUDENT / COURSE</th><th>LMS CLICKS</th><th>RELATIVE ACTIVITY</th><th>ACADEMIC INDICATOR</th></tr></thead><tbody>



                      {[...students].sort((a, b) => Number(b.total_lms_clicks || 0) - Number(a.total_lms_clicks || 0)).map((student) => {



                        const clicks = Number(student.total_lms_clicks || 0);



                        const maxClicks = Math.max(1, ...students.map((item) => Number(item.total_lms_clicks || 0)));



                        const riskClass = student.academic_risk === "At risk" ? "high" : student.academic_risk === "Lower risk" ? "low" : "medium";



                        return <tr key={`${student.id_student}-${student.code_module}-${student.code_presentation}`} onClick={() => setSelectedStudent(student)} title="Click to view student-course details" style={{ cursor: "pointer" }} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedStudent(student); }}><td><div className="student-identity"><div className={`student-avatar ${riskClass}`}>{String(student.id_student).slice(-2)}</div><div><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedStudent(student); }} style={{ padding: 0, border: 0, background: "transparent", color: "#1f2937", font: "inherit", fontWeight: 600, textAlign: "left", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>ID {student.id_student}</button><span>{student.code_module} · {student.code_presentation}</span></div></div></td><td><strong>{formatNumber(clicks)}</strong></td><td><div style={{ minWidth: 110, height: 7, background: "#edf1f7", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${Math.min(100, clicks / maxClicks * 100)}%`, height: "100%", background: "#3978e8", borderRadius: 99 }} /></div></td><td><span className={`risk-badge ${riskClass}`}><span />{student.academic_risk}</span></td></tr>;



                      })}



                      {!loading && students.length === 0 && <tr><td colSpan="4" className="empty-state">No engagement records match the current filters.</td></tr>}



                    </tbody></table></div>



                  </section>



                </>



              )}







              {activePage === "Methodology" && (



                <>



                  <section className="metrics-grid" style={{ marginTop: 24 }}>



                    <MetricCard label="Assessment weight" value="60%" icon={BookOpen} tone="blue" caption="Proposed Success Score formula" />



                    <MetricCard label="Engagement weight" value="40%" icon={Activity} tone="green" caption="Relative LMS engagement percentile" />



                    <MetricCard label="Model test accuracy" value={mlResults?.accuracy == null ? "—" : `${(mlResults.accuracy * 100).toFixed(2)}%`} icon={Target} tone="purple" caption="Held-out evaluation, when available" />



                    <MetricCard label="Test records" value={formatNumber(mlResults?.test_records)} icon={Users} tone="orange" caption="Model evaluation dataset" />



                  </section>



                  <section className="analytics-grid" style={{ marginTop: 24 }}>



                    <article className="panel" style={{ padding: 24 }}><div className="panel-kicker">SUCCESS SCORE</div><h2>Proposed indicator</h2><p>Assessment mean contributes 60% and relative LMS engagement contributes 40%. This score is descriptive and has not been validated as a prediction of future success.</p><div className="factor-row"><span>Assessment mean</span><strong>60%</strong></div><div className="factor-row"><span>Relative engagement percentile</span><strong>40%</strong></div></article>



                    <article className="panel" style={{ padding: 24 }}><div className="panel-kicker">LIMITATIONS</div><h2>Use with context</h2><p>OULAD is historical anonymized learning data. It does not provide physical classroom attendance or verified placement outcomes. LMS clicks are not attendance, and missing assessment data is not zero.</p><p style={{ marginTop: 12 }}>Risk flags require further validation and must not be used alone to make academic or placement decisions.</p><button className="text-button" onClick={() => setShowScoreInfo(true)} style={{ marginTop: 12 }}>Open methodology details <ArrowRight size={15} /></button></article>



                  </section>



                  {mlResults && <section className="panel" style={{ padding: 24, marginTop: 24 }}><div className="panel-kicker">MODEL EVALUATION</div><h2>Per-class performance</h2><div style={{ overflowX: "auto" }}><table className="student-table"><thead><tr><th>OUTCOME</th><th>PRECISION</th><th>RECALL</th><th>F1 SCORE</th><th>TEST SAMPLES</th></tr></thead><tbody>{(mlResults.class_labels || []).map((label) => { const metric = mlResults.classification_report?.[label]; if (!metric) return null; return <tr key={label}><td>{label}</td><td>{(metric.precision * 100).toFixed(1)}%</td><td>{(metric.recall * 100).toFixed(1)}%</td><td>{(metric["f1-score"] * 100).toFixed(1)}%</td><td>{formatNumber(metric.support)}</td></tr>; })}</tbody></table></div></section>}



                </>



              )}



            </>



          )}



          <footer className="page-footer">



            <span>



              CampusIQ <span className="footer-separator">/</span>{" "}



              Campus intelligence, with context.



            </span>



            <span>



              <span className="footer-status" />



              OULAD historical research data · Not live college records



            </span>



          </footer>



        </div>







{activePage === "Dashboard" && (



<>



{/* CampusIQ ML Model Performance */}



<section className="dashboard-section" style={{ marginTop: 28 }}>



  <div className="section-heading">



    <div>



      <div className="panel-kicker">MACHINE LEARNING</div>



      <h2>Student Outcome Model</h2>



      <p>Random Forest classification evaluated on held-out students.</p>



    </div>



    <span className="status-badge">



      {mlResults ? "Evaluation loaded" : "Loading evaluation"}



    </span>



  </div>







  {mlResults ? (



    <>



      <div className="metrics-grid">



        <MetricCard



          label="Test Accuracy"



          value={`${(mlResults.accuracy * 100).toFixed(2)}%`}



          icon={Target}



          tone="blue"



          caption={`${formatNumber(mlResults.test_records)} test records`}



        />



        <MetricCard



          label="Macro F1"



          value={Number(mlResults.macro_f1).toFixed(3)}



          icon={Activity}



          tone="green"



          caption="Average F1 across four classes"



        />



        <MetricCard



          label="Training Records"



          value={formatNumber(mlResults.train_records)}



          icon={Users}



          tone="blue"



          caption="Training split"



        />



        <MetricCard



          label="Outcome Classes"



          value={String(mlResults.class_labels?.length || 0)}



          icon={GraduationCap}



          tone="green"



          caption="Pass, Fail, Distinction, Withdrawn"



        />



      </div>







      <div className="panel" style={{ marginTop: 20, padding: 24 }}>



        <h3>Per-Class Model Performance</h3>



        <p>Precision and recall show where the model performs well or needs improvement.</p>







        <div style={{ overflowX: "auto" }}>



          <table className="students-table">



            <thead>



              <tr>



                <th>Outcome</th>



                <th>Precision</th>



                <th>Recall</th>



                <th>F1 Score</th>



                <th>Test Samples</th>



              </tr>



            </thead>



            <tbody>



              {(mlResults.class_labels || []).map((label) => {



                const metric = mlResults.classification_report?.[label];



                if (!metric) return null;







                return (



                  <tr key={label}>



                    <td>{label}</td>



                    <td>{(metric.precision * 100).toFixed(1)}%</td>



                    <td>{(metric.recall * 100).toFixed(1)}%</td>



                    <td>{(metric["f1-score"] * 100).toFixed(1)}%</td>



                    <td>{formatNumber(metric.support)}</td>



                  </tr>



                );



              })}



            </tbody>



          </table>



        </div>



      </div>







      <div className="panel" style={{ marginTop: 20, padding: 24 }}>



        <h3>Confusion Matrix</h3>



        <p>Rows are actual outcomes; columns are model predictions.</p>







        <div style={{ overflowX: "auto" }}>



          <table className="students-table">



            <thead>



              <tr>



                <th>Actual / Predicted</th>



                {(mlResults.class_labels || []).map((label) => (



                  <th key={label}>{label}</th>



                ))}



              </tr>



            </thead>



            <tbody>



              {(mlResults.confusion_matrix || []).map((row, i) => (



                <tr key={mlResults.class_labels[i]}>



                  <td>{mlResults.class_labels[i]}</td>



                  {row.map((value, j) => (



                    <td key={j}>{formatNumber(value)}</td>



                  ))}



                </tr>



              ))}



            </tbody>



          </table>



        </div>



      </div>







      <p style={{ marginTop: 14, fontSize: 12, color: "#748094" }}>



        Research baseline using historical OULAD data. Accuracy is not a measure



        of intervention effectiveness. This retrospective model is not yet a



        validated early-warning system.



      </p>



    </>



  ) : (



    <div className="panel" style={{ padding: 24 }}>



      ML evaluation results are loading or unavailable. Check the backend endpoint.



    </div>



  )}



</section>



</>



)}







      </main>







      {selectedStudent && (

        <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>

          <section className="score-modal" role="dialog" aria-modal="true" aria-labelledby="student-detail-title" onClick={(event) => event.stopPropagation()}>

            <button className="modal-close" onClick={() => setSelectedStudent(null)} aria-label="Close student details"><X size={19} /></button>

            <div className="modal-icon"><Users size={22} /></div>

            <div className="panel-kicker">STUDENT-COURSE RECORD</div>

            <h2 id="student-detail-title">Student ID {selectedStudent.id_student}</h2>

            <p>Historical anonymized OULAD record. This is a course-level record, not a complete live student profile.</p>

            <div className="modal-formula">

              <div><span>Module</span><strong>{selectedStudent.code_module || "—"}</strong></div>

              <div><span>Presentation</span><strong>{selectedStudent.code_presentation || "—"}</strong></div>

              <div><span>Total LMS clicks</span><strong>{formatNumber(selectedStudent.total_lms_clicks)}</strong></div>

              <div><span>Proposed success score</span><strong>{formatScore(selectedStudent.success_score)} / 100</strong></div>

              <div><span>Academic indicator</span><strong>{selectedStudent.academic_risk || "—"}</strong></div>

              <div><span>Final outcome</span><strong>{selectedStudent.final_result || selectedStudent.final_outcome || "Not available"}</strong></div>

            </div>

            <button className="primary-button modal-done" onClick={() => setSelectedStudent(null)}>Close details</button>

          </section>

        </div>

      )}



      {showScoreInfo && (



        <div



          className="modal-backdrop"



          onClick={() => setShowScoreInfo(false)}



        >



          <section



            className="score-modal"



            role="dialog"



            aria-modal="true"



            aria-labelledby="score-modal-title"



            onClick={(event) => event.stopPropagation()}



          >



            <button



              className="modal-close"



              onClick={() => setShowScoreInfo(false)}



              aria-label="Close dialog"



            >



              <X size={19} />



            </button>



            <div className="modal-icon"><Activity size={22} /></div>



            <div className="panel-kicker">METHODOLOGY & LIMITATIONS</div>



            <h2 id="score-modal-title">How the Success Score works</h2>



            <p>



              The current proposed score combines the mean of available



              assessment scores (60%) with a relative cohort percentile of



              total LMS clicks (40%). It is a descriptive demo indicator,



              not a validated predictive model.



            </p>



            <div className="modal-formula">



              <div><span>Assessment mean</span><strong>60%</strong></div>



              <div><span>Cohort engagement percentile</span><strong>40%</strong></div>



            </div>



            <div className="modal-warning">



              <ShieldAlert size={17} />



              <p>



                <strong>Important limitations</strong><br />



                OULAD does not include physical classroom attendance or



                verified placement outcomes. LMS clicks are not attendance.



                Missing assessment data is not treated as zero. Risk flags



                require further validation and must not be used alone to



                make academic or placement decisions.



              </p>



            </div>



            <button



              className="primary-button modal-done"



              onClick={() => setShowScoreInfo(false)}



            >



              Understood



            </button>



          </section>



        </div>



      )}



    </div>



  );



}







export default App;

















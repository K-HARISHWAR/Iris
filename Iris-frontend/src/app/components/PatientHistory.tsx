import { useState, useEffect } from "react";
import { Search, Filter, Eye, X, User, Calendar, Activity, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { getAllPatients, deletePatient } from "../utils/api";

export function PatientHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load patient records from Supabase database
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      
      // Fetch from Supabase
      const patients = await getAllPatients();
      
      if (patients.length > 0) {
        setPatientRecords(patients);
      } else {
        // If no patients in database, check localStorage for fallback
        const storedRecordsStr = localStorage.getItem('patientRecords');
        const storedRecords = storedRecordsStr ? JSON.parse(storedRecordsStr) : [];
        
        if (storedRecords.length === 0) {
          // If no stored records, use mock data for demo
          const mockRecords = [
            {
              id: "P-1001",
              name: "John Doe",
              age: 45,
              lastVisit: "2026-02-21",
              totalAnalyses: 8,
              latestDiagnosis: "Glaucoma",
              riskLevel: "High",
              confidence: 89,
            },
            {
              id: "P-1002",
              name: "Jane Smith",
              age: 38,
              lastVisit: "2026-02-21",
              totalAnalyses: 5,
              latestDiagnosis: "Diabetic Retinopathy",
              riskLevel: "High",
              confidence: 92,
            },
            {
              id: "P-1003",
              name: "Michael Johnson",
              age: 52,
              lastVisit: "2026-02-20",
              totalAnalyses: 12,
              latestDiagnosis: "No Abnormality",
              riskLevel: "Low",
              confidence: 96,
            },
            {
              id: "P-1004",
              name: "Emily Davis",
              age: 61,
              lastVisit: "2026-02-20",
              totalAnalyses: 15,
              latestDiagnosis: "Cataract",
              riskLevel: "Medium",
              confidence: 88,
            },
            {
              id: "P-1005",
              name: "Robert Wilson",
              age: 49,
              lastVisit: "2026-02-19",
              totalAnalyses: 6,
              latestDiagnosis: "Macular Degeneration",
              riskLevel: "High",
              confidence: 85,
            },
            {
              id: "P-1006",
              name: "Sarah Brown",
              age: 33,
              lastVisit: "2026-02-19",
              totalAnalyses: 3,
              latestDiagnosis: "No Abnormality",
              riskLevel: "Low",
              confidence: 94,
            },
          ];
          setPatientRecords(mockRecords);
        } else {
          setPatientRecords(storedRecords);
        }
      }
      
      setIsLoading(false);
    };

    fetchPatients();
  }, []);

  const filteredRecords = patientRecords.filter((record) => {
    const matchesSearch =
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "high" && record.riskLevel === "High") ||
      (filterStatus === "medium" && record.riskLevel === "Medium") ||
      (filterStatus === "low" && record.riskLevel === "Low");
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Patient History</h1>
        <p className="text-slate-600 mt-1">View and manage patient records and analysis history</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("high")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "high"
                    ? "bg-red-500 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setFilterStatus("medium")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "medium"
                    ? "bg-yellow-500 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Medium Risk
              </button>
              <button
                onClick={() => setFilterStatus("low")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "low"
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Low Risk
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.map((patient) => (
          <Card key={patient.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {patient.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{patient.name}</CardTitle>
                    <CardDescription className="text-xs">{patient.id}</CardDescription>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    patient.riskLevel === "High"
                      ? "bg-red-100 text-red-700"
                      : patient.riskLevel === "Medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {patient.riskLevel}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Age</p>
                  <p className="font-semibold text-slate-900">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-slate-500">Analyses</p>
                  <p className="font-semibold text-slate-900">{patient.totalAnalyses}</p>
                </div>
              </div>

              {/* Latest Diagnosis */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Latest Diagnosis</p>
                <p className="font-semibold text-slate-900 text-sm">{patient.latestDiagnosis}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">Confidence</span>
                  <span className="text-sm font-bold text-blue-500">{patient.confidence}%</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setSelectedPatient(patient)}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => setDeleteConfirmId(patient.id)}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No patient records found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl">
                  {selectedPatient.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedPatient.name}</h2>
                  <p className="text-slate-600 font-mono text-sm">{selectedPatient.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Patient ID</p>
                    <p className="font-semibold text-slate-900 font-mono">{selectedPatient.id}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Full Name</p>
                    <p className="font-semibold text-slate-900">{selectedPatient.name}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Age</p>
                    <p className="font-semibold text-slate-900">{selectedPatient.age} years</p>
                  </div>
                  {selectedPatient.dateOfBirth && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Date of Birth</p>
                      <p className="font-semibold text-slate-900">{selectedPatient.dateOfBirth}</p>
                    </div>
                  )}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Total Analyses</p>
                    <p className="font-semibold text-slate-900">{selectedPatient.totalAnalyses}</p>
                  </div>
                  {selectedPatient.lastVisit && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Last Visit</p>
                      <p className="font-semibold text-slate-900">{selectedPatient.lastVisit}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Latest Diagnosis */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Latest Diagnosis
                </h3>
                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-slate-900">{selectedPatient.latestDiagnosis}</h4>
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        selectedPatient.riskLevel === "High"
                          ? "bg-red-100 text-red-700"
                          : selectedPatient.riskLevel === "Medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {selectedPatient.riskLevel} Risk
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Confidence Level</span>
                        <span className="text-sm font-bold text-blue-500">{selectedPatient.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${selectedPatient.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis History & Comparison */}
              {selectedPatient.analyses && selectedPatient.analyses.length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Analysis History & Comparison
                  </h3>
                  
                  {/* Comparison Summary */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Progression Comparison</p>
                        {(() => {
                          const analyses = [...selectedPatient.analyses].sort((a: any, b: any) => 
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                          );
                          const latest = analyses[0];
                          const previous = analyses[1];
                          
                          const diagnosisChanged = latest.diagnosis !== previous.diagnosis;
                          const riskChanged = latest.riskLevel !== previous.riskLevel;
                          const confidenceChange = latest.confidence - previous.confidence;
                          
                          return (
                            <div className="space-y-2 text-sm">
                              {diagnosisChanged && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-blue-800">Diagnosis:</span>
                                  <span className="text-blue-700">
                                    {previous.diagnosis} → {latest.diagnosis}
                                  </span>
                                </div>
                              )}
                              {riskChanged && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-blue-800">Risk Level:</span>
                                  <span className={`font-semibold ${
                                    (previous.riskLevel === "High" && latest.riskLevel !== "High") ? "text-green-600" :
                                    (previous.riskLevel !== "High" && latest.riskLevel === "High") ? "text-red-600" :
                                    "text-blue-700"
                                  }`}>
                                    {previous.riskLevel} → {latest.riskLevel}
                                    {(previous.riskLevel === "High" && latest.riskLevel !== "High") && " ✓ Improved"}
                                    {(previous.riskLevel !== "High" && latest.riskLevel === "High") && " ⚠ Worsened"}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-blue-800">Confidence Change:</span>
                                <span className={`font-semibold ${
                                  confidenceChange > 0 ? "text-green-600" :
                                  confidenceChange < 0 ? "text-orange-600" :
                                  "text-blue-700"
                                }`}>
                                  {confidenceChange > 0 ? "+" : ""}{confidenceChange}%
                                  {Math.abs(confidenceChange) > 0 && (confidenceChange > 0 ? " ↑" : " ↓")}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* All Analyses Timeline */}
                  <div className="space-y-3">
                    {[...selectedPatient.analyses]
                      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((analysis: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            index === 0
                              ? "bg-blue-50 border-blue-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-semibold text-slate-700">
                                {new Date(analysis.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                                  Latest
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                analysis.riskLevel === "High"
                                  ? "bg-red-100 text-red-700"
                                  : analysis.riskLevel === "Medium"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {analysis.riskLevel}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Diagnosis</p>
                              <p className="text-sm font-semibold text-slate-900">{analysis.diagnosis}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Confidence</p>
                              <p className="text-sm font-semibold text-blue-600">{analysis.confidence}%</p>
                            </div>
                          </div>

                          {/* Analysis Image */}
                          {analysis.imageData && (
                            <div className="mt-3">
                              <img
                                src={analysis.imageData}
                                alt={`Analysis from ${analysis.date}`}
                                className="w-full h-48 object-cover rounded-lg border border-slate-200"
                              />
                            </div>
                          )}

                          {/* Symptoms for this analysis */}
                          {analysis.symptoms && Object.values(analysis.symptoms).some((v: any) => v) && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-xs text-slate-500 mb-2">Symptoms:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(analysis.symptoms)
                                  .filter(([_, value]) => value)
                                  .map(([symptom]) => (
                                    <span
                                      key={symptom}
                                      className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded"
                                    >
                                      {symptom.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Symptoms */}
              {selectedPatient.symptoms && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    Reported Symptoms
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(selectedPatient.symptoms).map(([symptom, value]) => (
                      <div
                        key={symptom}
                        className={`p-3 rounded-lg border ${
                          value
                            ? "bg-red-50 border-red-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {value ? (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-slate-400" />
                          )}
                          <span className={`text-sm font-medium ${value ? "text-red-700" : "text-slate-500"}`}>
                            {symptom.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Iris Image */}
              {selectedPatient.imageData && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    Iris Image
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <img
                      src={selectedPatient.imageData}
                      alt="Iris scan"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (() => {
        const patientToDelete = patientRecords.find(p => p.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmId(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Delete Patient Record</h3>
                    <p className="text-sm text-slate-500">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-slate-700 mb-4">
                  Are you sure you want to permanently delete the record for:
                </p>
                {patientToDelete && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {patientToDelete.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{patientToDelete.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{patientToDelete.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Total Analyses:</span>
                        <span className="font-semibold text-slate-900 ml-1">{patientToDelete.totalAnalyses}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Last Visit:</span>
                        <span className="font-semibold text-slate-900 ml-1">{patientToDelete.lastVisit}</span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-red-600 mt-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  All analysis data and images will be permanently deleted.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    console.log(`🗑️ Deleting patient record: ${deleteConfirmId}`);
                    
                    // Delete from database
                    const success = await deletePatient(deleteConfirmId);
                    
                    if (success) {
                      console.log('✅ Successfully deleted from database');
                    } else {
                      console.warn('⚠️ Failed to delete from database, will still remove from localStorage');
                    }
                    
                    // Also delete from localStorage
                    const storedRecordsStr = localStorage.getItem('patientRecords');
                    if (storedRecordsStr) {
                      const storedRecords = JSON.parse(storedRecordsStr);
                      const updatedRecords = storedRecords.filter((r: any) => r.id !== deleteConfirmId);
                      localStorage.setItem('patientRecords', JSON.stringify(updatedRecords));
                      console.log('✅ Removed from localStorage');
                    }
                    
                    // Update UI
                    const updatedRecords = patientRecords.filter(p => p.id !== deleteConfirmId);
                    setPatientRecords(updatedRecords);
                    setDeleteConfirmId(null);
                    
                    console.log('✅ Patient record deleted successfully');
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
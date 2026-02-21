import { Link } from "react-router";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useState, useEffect } from "react";
import { getAllPatients } from "../utils/api";

export function Home() {
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        // Try to get data from API first
        const patients = await getAllPatients();
        
        if (patients && patients.length > 0) {
          // Sort by most recent and take top 5
          const sortedPatients = [...patients].sort((a, b) => {
            const dateA = new Date(a.lastVisit || a.createdAt || 0);
            const dateB = new Date(b.lastVisit || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          // Format for display
          const formattedAnalyses = sortedPatients.slice(0, 5).map((patient, index) => {
            const visitDate = new Date(patient.lastVisit || patient.createdAt || new Date());
            return {
              id: patient.id,
              patient: patient.name,
              disease: patient.latestDiagnosis || "Unknown",
              confidence: patient.confidence || 0,
              date: visitDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
              time: visitDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };
          });
          
          setRecentAnalyses(formattedAnalyses);
        } else {
          // No data yet
          setRecentAnalyses([]);
        }
      } catch (error) {
        console.log('Failed to load from API, trying localStorage fallback');
        
        // Fallback to localStorage
        const storedRecordsStr = localStorage.getItem('patientRecords');
        if (storedRecordsStr) {
          const storedRecords = JSON.parse(storedRecordsStr);
          
          if (storedRecords && storedRecords.length > 0) {
            // Take top 5 most recent
            const formattedAnalyses = storedRecords.slice(0, 5).map((patient: any) => {
              const visitDate = new Date(patient.lastVisit || new Date());
              return {
                id: patient.id,
                patient: patient.name,
                disease: patient.latestDiagnosis || "Unknown",
                confidence: patient.confidence || 0,
                date: visitDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                time: visitDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              };
            });
            
            setRecentAnalyses(formattedAnalyses);
          } else {
            setRecentAnalyses([]);
          }
        }
      }
    };

    loadPatientData();
  }, []);

  const stats = [
    {
      title: "Total Analyses",
      value: "120",
      change: recentAnalyses.length > 0 ? `${recentAnalyses.length} recent` : "No analyses yet",
      icon: Activity,
      color: "text-blue-500",
    },
    {
      title: "Active Patients",
      value: "30",
      change: "30 registered",
      icon: Activity,
      color: "text-green-500",
    },
    {
      title: "Accuracy Rate",
      value: "94.7%",
      change: "ML Model Performance",
      icon: Activity,
      color: "text-purple-500",
    },
    {
      title: "Avg. Analysis Time",
      value: "2.3s",
      change: "Processing Speed",
      icon: Activity,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, Here's your overview.</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start a new analysis or view patient records</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link
            to="/new-analysis"
            className="flex-1 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center font-medium"
          >
            Start New Analysis
          </Link>
          <Link
            to="/patient-history"
            className="flex-1 px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition-colors text-center font-medium"
          >
            View Patient History
          </Link>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>Latest iris scans and predictions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length > 0 ? (
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-500">{analysis.id}</span>
                      <span className="text-sm font-medium text-slate-900">{analysis.patient}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{analysis.disease}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {analysis.confidence}% confidence
                      </p>
                      <p className="text-xs text-slate-500">{analysis.date} • {analysis.time}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        analysis.confidence >= 90
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {analysis.confidence >= 90 ? "High" : "Medium"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Analyses Yet</h3>
              <p className="text-sm text-slate-600 mb-6">Start your first iris analysis to see results here</p>
              <Link
                to="/new-analysis"
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                Start New Analysis
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
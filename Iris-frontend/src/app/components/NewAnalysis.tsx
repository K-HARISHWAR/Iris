import { useState, useMemo, useEffect } from "react";
import { Upload, Loader2, AlertCircle, ServerCrash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { IrisScanner } from "./IrisScanner";
import { AnalysisResults } from "./AnalysisResults";
import { savePatient, getNextPatientId, getAllPatients, analyzeIrisImage, IrisAnalysisResult } from "../utils/api";

export function NewAnalysis() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);   // raw File for FormData
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mlResult, setMlResult] = useState<IrisAnalysisResult | null>(null);
  const [mlError, setMlError] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>("PID-00001");
  const [isExistingPatient, setIsExistingPatient] = useState<boolean>(false);
  const [isLoadingPatientId, setIsLoadingPatientId] = useState<boolean>(false);
  const [existingPatientData, setExistingPatientData] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<{
    eye_pain: boolean;
    redness: boolean;
    blurred_vision: boolean;
    light_sensitivity: boolean;
    itching: boolean;
  }>({
    eye_pain: false,
    redness: false,
    blurred_vision: false,
    light_sensitivity: false,
    itching: false,
  });

  // Generate next patient ID on mount or when patient info changes
  useEffect(() => {
    const generatePatientId = async () => {
      // Reset existing patient flag initially
      setIsExistingPatient(false);

      if (patientName.trim() && dateOfBirth) {
        console.log('🔍 Checking for existing patient:', { name: patientName, dob: dateOfBirth });

        // Check if patient already exists - try API first, then localStorage
        try {
          const patients = await getAllPatients();
          console.log('📊 Total patients in database:', patients.length);

          const existingPatient = patients.find(
            (p) => {
              const nameMatch = p.name.toLowerCase().trim() === patientName.trim().toLowerCase();
              const dobMatch = p.dateOfBirth === dateOfBirth;
              console.log(`  Comparing: "${p.name}" (DOB: ${p.dateOfBirth}) vs "${patientName}" (DOB: ${dateOfBirth})`, { nameMatch, dobMatch });
              return nameMatch && dobMatch;
            }
          );

          if (existingPatient) {
            setPatientId(existingPatient.id);
            setIsExistingPatient(true);
            setExistingPatientData(existingPatient);
            console.log('✅ Found existing patient:', existingPatient.id, existingPatient);
            return;
          } else {
            console.log('❌ No matching patient found in database');
          }
        } catch (error) {
          console.log('⚠️ API failed, using localStorage fallback for patient lookup');
          // Fallback to localStorage
          const storedRecordsStr = localStorage.getItem('patientRecords');
          const storedRecords = storedRecordsStr ? JSON.parse(storedRecordsStr) : [];
          console.log('📊 Total patients in localStorage:', storedRecords.length);

          const existingPatient = storedRecords.find(
            (r: any) => {
              const nameMatch = r.name.toLowerCase().trim() === patientName.trim().toLowerCase();
              const dobMatch = r.dateOfBirth === dateOfBirth;
              console.log(`  Comparing: "${r.name}" (DOB: ${r.dateOfBirth}) vs "${patientName}" (DOB: ${dateOfBirth})`, { nameMatch, dobMatch });
              return nameMatch && dobMatch;
            }
          );

          if (existingPatient) {
            setPatientId(existingPatient.id);
            setIsExistingPatient(true);
            setExistingPatientData(existingPatient);
            console.log('✅ Found existing patient in localStorage:', existingPatient.id);
            return;
          } else {
            console.log('❌ No matching patient found in localStorage');
          }
        }
      }

      // No existing patient found - generate new ID
      console.log('🆕 Generating new patient ID');

      // Generate new ID - try API first, then localStorage
      try {
        const nextId = await getNextPatientId();
        setPatientId(nextId);
        console.log('✨ Generated new ID from API:', nextId);
      } catch (error) {
        console.log('⚠️ Using localStorage fallback for ID generation');
        // Fallback to localStorage-based ID generation with gap-filling
        const storedRecordsStr = localStorage.getItem('patientRecords');
        const storedRecords = storedRecordsStr ? JSON.parse(storedRecordsStr) : [];

        // Extract all existing numeric IDs
        const existingIds: number[] = [];
        storedRecords.forEach((r: any) => {
          const match = r.id.match(/PID-(\d+)/);
          if (match) {
            const numId = parseInt(match[1], 10);
            existingIds.push(numId);
          }
        });

        // Sort IDs to find gaps
        existingIds.sort((a, b) => a - b);

        // Find the first gap (missing number) in the sequence
        let nextNumericId = 1; // Start from 1
        for (const id of existingIds) {
          if (id === nextNumericId) {
            nextNumericId++; // This ID exists, check next
          } else if (id > nextNumericId) {
            // Found a gap! Use this nextNumericId
            break;
          }
        }

        const newId = `PID-${nextNumericId.toString().padStart(5, '0')}`;
        setPatientId(newId);
        console.log(`✨ Generated new ID from localStorage (gap-filling): ${newId} (existing IDs: [${existingIds.join(', ')}])`);
      }
    };

    generatePatientId();
  }, [patientName, dateOfBirth]);

  const currentDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Calculate age from date of birth
  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setDateOfBirth(dob);

    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't occurred this year yet
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  };

  // Validate if uploaded image contains an eye/iris
  const validateIrisImage = async (imageData: string): Promise<boolean> => {
    // In production, this would call an ML model or vision API
    // For now, we'll do basic validation checks
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Check basic image properties
        const hasValidDimensions = img.width >= 100 && img.height >= 100;
        const hasValidAspectRatio = (img.width / img.height) >= 0.5 && (img.width / img.height) <= 2;

        // For demo purposes, accept all images that meet basic criteria
        // In production, you would integrate an ML model here to detect iris/eye
        const isValid = hasValidDimensions && hasValidAspectRatio;

        if (!isValid) {
          console.log('Image validation failed:', {
            width: img.width,
            height: img.height,
            hasValidDimensions,
            hasValidAspectRatio
          });
        }

        resolve(isValid);
      };
      img.onerror = () => {
        console.error('Failed to load image for validation');
        resolve(false);
      };
      img.src = imageData;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsValidatingImage(true);
      setImageValidationError(null);
      setMlError(null);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;

        // Validate the image
        const isValid = await validateIrisImage(imageData);

        setIsValidatingImage(false);

        if (isValid) {
          setUploadedImage(imageData);
          setUploadedFile(file);           // keep raw File for FormData upload
          setShowResults(false);
          setMlResult(null);
          setImageValidationError(null);
        } else {
          setUploadedImage(null);
          setUploadedFile(null);
          setImageValidationError("Please upload an image of an eye. The uploaded image does not appear to be an iris photograph.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadedImage || !uploadedFile) return;

    setIsScanning(true);
    setShowResults(false);
    setMlError(null);
    setMlResult(null);

    try {
      // ── Call the real Python FastAPI ML server ──────────────────────────
      const result = await analyzeIrisImage(uploadedFile);
      setMlResult(result);

      // Map ML output → patient record fields
      const latestDiagnosis = result.abnormality.is_abnormal
        ? `Abnormal (${result.iris_colour.predicted_class})`
        : `Normal (${result.iris_colour.predicted_class})`;
      const riskLevel = result.abnormality.is_abnormal ? "High" : "Low";
      const confidence = Math.round(result.abnormality.confidence * 100);

      // Create new analysis record
      const newAnalysis = {
        date: new Date().toISOString().split('T')[0],
        diagnosis: latestDiagnosis,
        riskLevel,
        confidence,
        imageData: uploadedImage,
        symptoms,
        timestamp: new Date().toISOString(),
        irisColour: result.iris_colour.predicted_class,
        isAbnormal: result.abnormality.is_abnormal,
      };

      // Prepare patient record for Supabase
      const newRecord = {
        id: patientId,
        name: patientName || "Unknown Patient",
        age: calculatedAge || 0,
        dateOfBirth,
        lastVisit: new Date().toISOString().split('T')[0],
        totalAnalyses: 1,
        latestDiagnosis,
        riskLevel,
        confidence,
        imageData: uploadedImage,
        symptoms,
      };

      // Save to Supabase
      const savedPatient = await savePatient(newRecord);
      if (savedPatient) {
        console.log('✅ Patient record saved to database:', savedPatient);
      } else {
        console.warn('⚠️ Could not save to Supabase – using localStorage fallback');
      }

      // Also save to localStorage as offline backup
      const existingRecordsStr = localStorage.getItem('patientRecords');
      const existingRecords = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
      const existingIndex = existingRecords.findIndex((r: any) => r.id === patientId);

      if (existingIndex >= 0) {
        const existingPatient = existingRecords[existingIndex];
        existingRecords[existingIndex] = {
          ...existingPatient,
          ...newRecord,
          totalAnalyses: existingPatient.totalAnalyses + 1,
          analyses: [...(existingPatient.analyses || []), newAnalysis],
        };
      } else {
        existingRecords.unshift({ ...newRecord, analyses: [newAnalysis] });
      }
      localStorage.setItem('patientRecords', JSON.stringify(existingRecords));

      setShowResults(true);
    } catch (err: any) {
      console.error('ML analysis error:', err);
      setMlError(
        err?.message?.includes('fetch')
          ? 'Cannot reach the ML server. Make sure you ran: uvicorn backend.app:app --reload'
          : (err?.message ?? 'Analysis failed. Please try again.')
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">New Analysis</h1>
        <p className="text-slate-600 mt-1">Upload an iris image and run AI-powered disease prediction</p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Patient details and analysis metadata</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
            {/* Left Side - Patient Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="analysisDate" className="text-sm font-medium text-slate-700">
                  Analysis Date
                </Label>
                <div className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-sm">
                  {currentDate}
                </div>
              </div>

              <div>
                <Label htmlFor="patientId" className="text-sm font-medium text-slate-700">
                  Patient ID
                </Label>
                <div className="relative">
                  <div className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm">
                    {patientId}
                  </div>
                  {isExistingPatient && patientName && dateOfBirth && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">Existing Patient:</span> This patient ID was found in the database. Analysis will be added to their history.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="patientName" className="text-sm font-medium text-slate-700">
                  Patient Name *
                </Label>
                <input
                  id="patientName"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">
                  Date of Birth *
                </Label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={handleDateOfBirthChange}
                  className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <Label htmlFor="patientAge" className="text-sm font-medium text-slate-700">
                  Age
                </Label>
                <div className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-semibold text-sm">
                  {calculatedAge !== null ? `${calculatedAge} years` : "-"}
                </div>
              </div>
            </div>

            {/* Right Side - Symptoms */}
            <div className="px-[20px] py-[0px] px-[40px] py-[0px]">
              <Label htmlFor="symptoms" className="text-sm font-medium text-slate-700 mb-2 block">
                Symptoms
              </Label>
              <div className="space-y-3 mt-1.5">
                <div className="flex items-center">
                  <input
                    id="eye_pain"
                    type="checkbox"
                    checked={symptoms.eye_pain}
                    onChange={(e) => setSymptoms({ ...symptoms, eye_pain: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="eye_pain" className="ml-2 text-sm text-slate-700 cursor-pointer">
                    Eye Pain
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    id="redness"
                    type="checkbox"
                    checked={symptoms.redness}
                    onChange={(e) => setSymptoms({ ...symptoms, redness: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="redness" className="ml-2 text-sm text-slate-700 cursor-pointer">
                    Redness
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    id="blurred_vision"
                    type="checkbox"
                    checked={symptoms.blurred_vision}
                    onChange={(e) => setSymptoms({ ...symptoms, blurred_vision: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="blurred_vision" className="ml-2 text-sm text-slate-700 cursor-pointer">
                    Blurred Vision
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    id="light_sensitivity"
                    type="checkbox"
                    checked={symptoms.light_sensitivity}
                    onChange={(e) => setSymptoms({ ...symptoms, light_sensitivity: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="light_sensitivity" className="ml-2 text-sm text-slate-700 cursor-pointer">
                    Light Sensitivity
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    id="itching"
                    type="checkbox"
                    checked={symptoms.itching}
                    onChange={(e) => setSymptoms({ ...symptoms, itching: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="itching" className="ml-2 text-sm text-slate-700 cursor-pointer">
                    Itching
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Iris Image Upload</CardTitle>
            <CardDescription>Upload a high-resolution iris photograph for analysis</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative">
              {!uploadedImage && !isValidatingImage ? (
                <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="mb-2 text-sm text-slate-600">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG or JPEG (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : isValidatingImage ? (
                <div className="flex flex-col items-center justify-center w-full h-96 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
                  <p className="text-sm text-slate-600 font-medium">Validating image...</p>
                  <p className="text-xs text-slate-500 mt-1">Checking if image contains an iris</p>
                </div>
              ) : uploadedImage ? (
                <div className="relative">
                  <IrisScanner image={uploadedImage} isScanning={isScanning} />
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setUploadedFile(null);
                      setShowResults(false);
                      setMlResult(null);
                      setMlError(null);
                      setImageValidationError(null);
                    }}
                    className="absolute top-4 right-4 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              ) : null}
            </div>
            {imageValidationError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Invalid Image</p>
                  <p className="text-sm text-red-600 mt-1">{imageValidationError}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ML Server Error Banner */}
        {mlError && (
          <div className="p-4 bg-orange-50 border border-orange-300 rounded-lg flex items-start gap-3">
            <ServerCrash className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800">ML Server Error</p>
              <p className="text-sm text-orange-700 mt-1">{mlError}</p>
            </div>
          </div>
        )}

        {/* Run Analysis Button */}
        <button
          onClick={handleRunAnalysis}
          disabled={!uploadedImage || isScanning}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${!uploadedImage || isScanning
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
        >
          {isScanning ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Iris Pattern...
            </span>
          ) : (
            "Run Analysis"
          )}
        </button>

        {/* Results Panel */}
        {showResults && mlResult && (
          <AnalysisResults
            mlResult={mlResult}
            onNewAnalysis={() => {
              setShowResults(false);
              setIsScanning(false);
              setUploadedImage(null);
              setUploadedFile(null);
              setMlResult(null);
              setMlError(null);
              setPatientName("");
              setDateOfBirth("");
              setCalculatedAge(null);
              setPatientId("PID-00001");
              setIsExistingPatient(false);
              setExistingPatientData(null);
              setSymptoms({
                eye_pain: false,
                redness: false,
                blurred_vision: false,
                light_sensitivity: false,
                itching: false,
              });
              setImageValidationError(null);
              console.log("✨ Form reset - Ready for new analysis");
            }}
            onExportPDF={() => {
              window.print();
              console.log("📄 Exporting analysis results as PDF");
            }}
          />
        )}
      </div>
    </div>
  );
}
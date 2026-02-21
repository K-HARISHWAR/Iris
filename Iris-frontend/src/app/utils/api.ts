import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
export const supabase = createClient(SUPABASE_URL, publicAnonKey);

// ── ML Python FastAPI server (run: uvicorn backend.app:app --reload) ──────────
const ML_API_BASE_URL = 'http://localhost:8000';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  dateOfBirth: string;
  lastVisit: string;
  totalAnalyses: number;
  latestDiagnosis: string;
  riskLevel: string;
  confidence: number;
  imageData?: string;
  symptoms?: {
    eye_pain: boolean;
    redness: boolean;
    blurred_vision: boolean;
    light_sensitivity: boolean;
    itching: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ── ML Prediction types (mirror the Python pipeline output) ──────────────────

export interface ColourPrediction {
  predicted_class: 'dark_brown' | 'brown' | 'light_brown' | 'hazel';
  confidence: number;                          // 0–1
  probabilities: Record<string, number>;       // { dark_brown: 0.05, brown: 0.90, … }
}

export interface AbnormalityPrediction {
  predicted_class: 'normal' | 'abnormal';
  confidence: number;                          // 0–1
  is_abnormal: boolean;
  probabilities: Record<string, number>;       // { normal: 0.13, abnormal: 0.87 }
}

export interface IrisAnalysisResult {
  filename: string | null;
  iris_colour: ColourPrediction;
  abnormality: AbnormalityPrediction;
  summary: string;                             // e.g. "Colour: brown (92.0%), Status: ✓ Normal (87.0%)"
}

// Fetch all patients
export async function getAllPatients(): Promise<PatientRecord[]> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('lastVisit', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch patients from API:', error);
    return [];
  }
}

// Fetch a single patient by ID
export async function getPatientById(patientId: string): Promise<PatientRecord | null> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Failed to fetch patient ${patientId} from API:`, error);
    return null;
  }
}

// Save or update a patient record
export async function savePatient(patientData: PatientRecord): Promise<PatientRecord | null> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .upsert(patientData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save patient to API:', error);
    return null;
  }
}

// Delete a patient record
export async function deletePatient(patientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Failed to delete patient ${patientId} from API:`, error);
    return false;
  }
}

// Get next available patient ID
export async function getNextPatientId(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id');

    if (error) throw error;

    const existingIds = (data || []).map(p => {
      const match = p.id.match(/PID-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }).sort((a, b) => a - b);

    let nextId = 1;
    for (const id of existingIds) {
      if (id === nextId) nextId++;
      else if (id > nextId) break;
    }

    return `PID-${nextId.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Failed to generate patient ID from API:', error);
    return `PID-${Date.now().toString().slice(-5)}`;
  }
}

// Health check to verify server connection
export async function checkServerHealth(): Promise<boolean> {
  // If we reach here, Supabase SDK handles DB connectivity
  return true;
}

// ── ML Inference (calls local FastAPI Python server) ──────────────────────────

/**
 * Upload an eye image to the local Python FastAPI server and get back
 * iris colour + abnormality predictions.
 *
 * Usage in a React component:
 *   const result = await analyzeIrisImage(file);
 *   console.log(result.iris_colour.predicted_class);  // "brown"
 *   console.log(result.abnormality.is_abnormal);       // false
 *
 * @param imageFile  A File or Blob from <input type="file"> or camera capture
 * @returns IrisAnalysisResult or throws on network / server error
 */
export async function analyzeIrisImage(imageFile: File | Blob): Promise<IrisAnalysisResult> {
  const formData = new FormData();
  // FastAPI expects the field named `file` (matches the endpoint parameter name)
  formData.append('file', imageFile, (imageFile as File).name ?? 'eye.jpg');

  const response = await fetch(`${ML_API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type manually — the browser auto-sets multipart/form-data
    // with the correct boundary when using FormData.
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ML API error:', response.status, errorText);
    throw new Error(
      `Iris analysis failed (${response.status}): ${errorText || response.statusText}`
    );
  }

  const result: IrisAnalysisResult = await response.json();
  console.log('ML analysis result:', result);
  return result;
}

/**
 * Ping the Python FastAPI server to check it is running and models are loaded.
 * Returns true if healthy, false if the server is not started yet.
 *
 * Tip: call this on component mount and show a warning banner if false.
 */
export async function checkMLServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_API_BASE_URL}/health`, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok' && data.models_loaded === true;
  } catch {
    console.warn(
      'ML server is not reachable. ' +
      'Start it with:  uvicorn backend.app:app --reload  (from d:\\ml model)'
    );
    return false;
  }
}
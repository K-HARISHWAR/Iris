import { Bell, Shield, User, Database, Palette, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export function Settings() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your application preferences and configurations</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general application behavior</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-save" className="text-base font-medium">
                Auto-save Reports
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Automatically save analysis reports after completion
              </p>
            </div>
            <Switch id="auto-save" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="high-quality" className="text-base font-medium">
                High-Quality Processing
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Use enhanced ML models for higher accuracy (slower)
              </p>
            </div>
            <Switch id="high-quality" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-base font-medium">
                Dark Mode
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Enable dark theme for the interface
              </p>
            </div>
            <Switch id="dark-mode" />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="analysis-complete" className="text-base font-medium">
                Analysis Complete Alerts
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Get notified when an analysis finishes
              </p>
            </div>
            <Switch id="analysis-complete" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="high-risk" className="text-base font-medium">
                High-Risk Detection Alerts
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Receive alerts for high-risk diagnoses
              </p>
            </div>
            <Switch id="high-risk" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-reports" className="text-base font-medium">
                Email Reports
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Send analysis reports via email automatically
              </p>
            </div>
            <Switch id="email-reports" />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>Manage data privacy and security settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="anonymize" className="text-base font-medium">
                Anonymize Patient Data
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Remove identifying information from exported reports
              </p>
            </div>
            <Switch id="anonymize" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="encryption" className="text-base font-medium">
                Encrypt Local Storage
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Encrypt all data stored on this device
              </p>
            </div>
            <Switch id="encryption" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor" className="text-base font-medium">
                Two-Factor Authentication
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Require 2FA for account access
              </p>
            </div>
            <Switch id="two-factor" />
          </div>
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>ML Model Configuration</CardTitle>
              <CardDescription>Configure machine learning model parameters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="confidence-threshold" className="text-base font-medium">
              Confidence Threshold
            </Label>
            <p className="text-sm text-slate-500 mt-1 mb-3">
              Minimum confidence level for predictions (current: 70%)
            </p>
            <input
              id="confidence-threshold"
              type="range"
              min="50"
              max="95"
              defaultValue="70"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>50%</span>
              <span>95%</span>
            </div>
          </div>

          <div>
            <Label htmlFor="model-version" className="text-base font-medium">
              Model Version
            </Label>
            <p className="text-sm text-slate-500 mt-1 mb-3">
              Select the ML model version to use
            </p>
            <select
              id="model-version"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>IrisAI v3.2 (Latest - Recommended)</option>
              <option>IrisAI v3.1 (Stable)</option>
              <option>IrisAI v3.0 (Legacy)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="batch-processing" className="text-base font-medium">
                Batch Processing
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Enable processing multiple images simultaneously
              </p>
            </div>
            <Switch id="batch-processing" />
          </div>
        </CardContent>
      </Card>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full-name" className="text-sm font-medium">
              Full Name
            </Label>
            <input
              id="full-name"
              type="text"
              defaultValue="Dr. Smith"
              className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <input
              id="email"
              type="email"
              defaultValue="dr.smith@hospital.com"
              className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="specialty" className="text-sm font-medium">
              Specialty
            </Label>
            <input
              id="specialty"
              type="text"
              defaultValue="Ophthalmologist"
              className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button className="w-full mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
            Save Changes
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

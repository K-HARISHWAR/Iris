import { createBrowserRouter } from "react-router";
import { Home } from "./components/Home";
import { NewAnalysis } from "./components/NewAnalysis";
import { PatientHistory } from "./components/PatientHistory";
import { Settings } from "./components/Settings";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "new-analysis", Component: NewAnalysis },
      { path: "patient-history", Component: PatientHistory },
      { path: "settings", Component: Settings },
    ],
  },
]);

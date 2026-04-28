import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BusinessProvider } from "@/contexts/BusinessContext";
import AppLayout from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Processes from "./pages/Processes";
import Quality from "./pages/Quality";
import Insights from "./pages/Insights";
import PFMEA from "./pages/PFMEA";
import Alerts from "./pages/Alerts";
import TaskTracking from "./pages/TaskTracking";
import BOM from "./pages/BOM";
import OEE from "./pages/OEE";
import ActivityLog from "./pages/ActivityLog";
import Reports from "./pages/Reports";
import ShiftHandoff from "./pages/ShiftHandoff";
import DowntimeTracking from "./pages/DowntimeTracking";
import WorkOrders from "./pages/WorkOrders";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Taskmaster from "./pages/Taskmaster";
import EightDReports from "./pages/EightDReports";
import FiveSAudits from "./pages/FiveSAudits";
import NotFound from "./pages/NotFound";
import QuickStart from "./pages/integration/QuickStart";
import CsvImporter from "./pages/integration/CsvImporter";
import OperatorEntry from "./pages/integration/OperatorEntry";
import MqttGuide from "./pages/integration/MqttGuide";
import PlcGuide from "./pages/integration/PlcGuide";
import Contact from "./pages/integration/Contact";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/integration/quick-start" element={<QuickStart />} />
      <Route path="/integration/csv-import" element={<CsvImporter />} />
      <Route path="/integration/operator-entry" element={<OperatorEntry />} />
      <Route path="/integration/mqtt-guide" element={<MqttGuide />} />
      <Route path="/integration/plc-guide" element={<PlcGuide />} />
      <Route path="/integration/contact" element={<Contact />} />
      <Route path="/checkout/:plan" element={<Checkout />} />
      <Route path="/dashboard" element={<AppLayout><Index /></AppLayout>} />
      <Route path="/taskmaster" element={<AppLayout><Taskmaster /></AppLayout>} />
      <Route path="/processes" element={<AppLayout><Processes /></AppLayout>} />
      <Route path="/quality" element={<AppLayout><Quality /></AppLayout>} />
      <Route path="/insights" element={<AppLayout><Insights /></AppLayout>} />
      <Route path="/pfmea" element={<AppLayout><PFMEA /></AppLayout>} />
      <Route path="/tasks" element={<AppLayout><TaskTracking /></AppLayout>} />
      <Route path="/8d-reports" element={<AppLayout><EightDReports /></AppLayout>} />
      <Route path="/5s-audits" element={<AppLayout><FiveSAudits /></AppLayout>} />
      <Route path="/bom" element={<AppLayout><BOM /></AppLayout>} />
      <Route path="/oee" element={<AppLayout><OEE /></AppLayout>} />
      <Route path="/alerts" element={<AppLayout><Alerts /></AppLayout>} />
      <Route path="/activity" element={<AppLayout><ActivityLog /></AppLayout>} />
      <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
      <Route path="/shift-handoff" element={<AppLayout><ShiftHandoff /></AppLayout>} />
      <Route path="/downtime" element={<AppLayout><DowntimeTracking /></AppLayout>} />
      <Route path="/work-orders" element={<AppLayout><WorkOrders /></AppLayout>} />
      <Route path="/documents" element={<AppLayout><Documents /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="opspilot-theme-v2"
    >
      <TooltipProvider>
        <BusinessProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </BusinessProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

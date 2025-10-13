import {
  UploadCloud,
  BarChart3,
//   CheckSquare,
  CalendarRange,
  CheckCheck,
} from "lucide-react";
import { useVisibleTabs } from "../../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../../components/layout/Tab.tsx";
import Layout from "../../../../components/layout/Layout.tsx";
import UploadMap from "./UploadMap.tsx";
import BusinessDashboard from "./BusinessDashboard.tsx";
import CompanyDashboard from "./CompanyDashboard.tsx";
import ApproveExport from "./ApproveExport";

const ExposureCreationTab = () => {
  //   const visibility = usePermissions("projection");
  const TAB_CONFIG = [
    {
      id: "Upload",
      label: "Upload and Map",
      icon: UploadCloud, 
      visibility: true,
    },
    {
      id: "BusinessDashboard",
      label: "Business",
      icon: BarChart3,
      visibility: true,
    },
    {
      id: "CompanyDashboard",
      label: "Dashboard",
      icon: CalendarRange,
      visibility: true,
    },
    {
      id: "ApproveExport",
      label: "Approve and Export",
      icon: CheckCheck,
      visibility: true,
    },
  ];

  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    "Upload"
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "Upload":
        currentContent = <UploadMap />;
        break;
      case "BusinessDashboard":
        currentContent = <BusinessDashboard />;
        break;
      case "CompanyDashboard":
        currentContent = <CompanyDashboard />;
        break;
      case "ApproveExport":
        currentContent = <ApproveExport />;
        break;
    //   case "HelpAssumptions":
    //     currentContent = <HelpAssumptions />;
    //     break;
    //   case "RunLogicTests":
    //     currentContent = <RunLogicTests />;
    //     break;
    }
  }

  return (
    <Layout title="Exposure Creation from SAP">
      <div className="mb-6 pt-4">
        <Tabs
          tabs={TAB_CONFIG}
          switchTab={switchTab}
          isActiveTab={isActiveTab}
        />
      </div>
      <div className="transition-opacity duration-300">{currentContent}</div>
    </Layout>
  );
};

export default ExposureCreationTab;

import {
  ChevronsLeftRightEllipsis,
  List,
  FileEdit,
  UploadCloud,
} from "lucide-react";

import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import Upload from "./costProfitCenterMasterUpload.tsx";
import Form from "./CostProfitMaster.tsx";
import ERP from "./costProfitCenterMasterErp.tsx";
import AllCostProfitCenters from "./AllCostProfitCenter.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
import { useLocation } from "react-router-dom";
const CostProfitCenterMaster = () => {
   const location = useLocation();
  const Visibility = usePermissions("cost-profit-center-master");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Cost/Profit List",
      icon: List,
      visibility: Visibility.allTab,
    },
    {
      id: "Form",
      label: "Manual Entry Form",
      icon: FileEdit,
      visibility: Visibility.manualEntryForm,
    },
    {
      id: "Upload",
      label: "Cost/Profit Account Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
    },
    {
      id: "add",
      label: "Cost/Profit Centre ERP",
      icon: ChevronsLeftRightEllipsis,
      visibility: Visibility.erpTab,
    },
  ];

  const initialTab =
    location.state && location.state.from === "form" ? "form" : "All";

  
  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    initialTab
  );

  
  if (!Visibility) {
    return <LoadingSpinner />;
  }

  let currentContent = <LoadingSpinner />;
  if (activeTab) {
    switch (activeTab) {
      case "Form":
        currentContent = <Form />;
        break;
      case "Upload":
        currentContent = <Upload />;
        break;
      case "add":
        currentContent = <ERP />;
        break;
      case "All":
        currentContent = <AllCostProfitCenters />;
        break;
        default:
        currentContent = (
          <div className="p-4 text-gray-600">No tab available</div>
        );
        break;
    }
  }

  return (
    <Layout title="Cost Profit Center Master">
      <div className="mb-6 pt-4">
        <Tabs
          tabs={TAB_CONFIG}
          // activeTab={activeTab}
          switchTab={switchTab}
          isActiveTab={isActiveTab}
        />
      </div>
      <div className="transition-opacity duration-300">{currentContent}</div>
    </Layout>
  );
};

export default CostProfitCenterMaster;

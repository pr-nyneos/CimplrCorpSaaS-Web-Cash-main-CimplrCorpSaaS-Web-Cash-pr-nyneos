import { ChevronsLeftRightEllipsis, FileEdit, List, UploadCloud } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import CashFlowCategoryMaster from "./CashFlowCategoryMaster";
import AllCashFlowCategories from "./AllCashFlowCategories";
import UploadFile from "./CashFlowCategoryUpload.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const CashFlowCategoryTab = () => {
  const Visibility = usePermissions("cashflow-category-master");   
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Cash Flow Categories",
      icon: List,
      visibility: Visibility.allTab,
    },
    {
      id: "form",
      label: "Manual Entry Form",
      icon: FileEdit,
      visibility: Visibility.manualEntryForm,
    },
    {
      id: "Upload",
      label: "Cash Flow Categories Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
      
    },
    {
      id: "add",
      label: "Cash Flow Categories ERP",
      icon: ChevronsLeftRightEllipsis,
      visibility: Visibility.erpTab,
    },
  ];

  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    "All"
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "All":
        currentContent = <AllCashFlowCategories />;
        break;
      case "form":
        currentContent = <CashFlowCategoryMaster />;
        break;
      case "Upload":
        currentContent = <UploadFile />;
        break;
    }
  }

  return (
    <Layout title="Cash Flow Category Master">
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

export default CashFlowCategoryTab;
import { ChevronsLeftRightEllipsis, FileEdit, List, UploadCloud } from "lucide-react";

import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
// import PayableReceivableMaster from "./PayableReceivableMaster";
import AllPayableReceivables from "./AllPayableReceivables";
import UploadFile from "./PayableReceivableUpload.tsx";
import Form from "./PayableReceivableForm.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
const PayableReceivableMasterTab = () => {
     const location = useLocation();
  const Visibility = usePermissions("payable-receivable-master"); 
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Payable/Receivables",
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
      label: "Payable/Receivables Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
    },
    {
      id: "add",
      label: "Payable/Receivables ERP",
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
      case "All":
        currentContent = <AllPayableReceivables />;
        break;
      case "form":
        currentContent = <Form />;
        break;
      case "Upload":
        currentContent = <UploadFile />;
        break;
         default:
       currentContent = (
          <div className="p-4 text-gray-600">No tab available</div>
        );
        break;
        
    }
  }

  return (
    <Layout title="Payable/Receivable Master">
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

export default PayableReceivableMasterTab;

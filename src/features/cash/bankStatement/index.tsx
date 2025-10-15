import { useVisibleTabs } from "../../../hooks/useVisibleTabs";
import Tabs from "../../../components/layout/Tab";
import { ChevronsLeftRightEllipsis, UploadCloud, FileEdit, List } from "lucide-react";

import Layout from "../../../components/layout/Layout";
import Upload from "./upload";
// import Form from "./form";
import BankStatementForm from "./BankStatementForm"; 
import AllBankStatement from "./AllBankStatement"
import ERP from "./erp";
import { usePermissions } from "../../../hooks/useMasterPermission";
import LoadingSpinner from "../../../components/layout/LoadingSpinner";
import { useLocation } from "react-router-dom";
const BankStatementUpload = () => {
   const location = useLocation();
  const visibility = usePermissions("bank-statement");
  const TAB_CONFIG = [
    {
      id:"All",
      label: "Bank Statement All",
      icon: List,
      visibility:visibility.allTab,
    },
    {
      id: "form",
      label: "Manual Entry Form",
      icon: FileEdit,
      visibility: visibility.manualEntryForm,
    },
    {
      id: "Upload",
      label: "Bank Statement Upload",
      icon: UploadCloud,
      visibility: visibility.uploadTab,
    },
    {
      id: "add",
      label: "Bank Statement ERP",
      icon: ChevronsLeftRightEllipsis,
      visibility: visibility.erpTab,
    },
  ];

 const initialTab =
    location.state && location.state.from === "form" ? "form" : "All";
  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    initialTab
  );

 if (!visibility) {
    return <LoadingSpinner />;
  }

  
 
let currentContent = <LoadingSpinner />;
  if (activeTab) {
    switch (activeTab) {
          case "form":
            currentContent = <BankStatementForm />;
            break;
      case "Upload":
        currentContent = <Upload />;
        break;
      case "add":
        currentContent = <ERP />;
        break;
      case "All":
        currentContent = <AllBankStatement />;
        break;
        default:
        currentContent = (
          <div className="p-4 text-gray-600">No tab available</div>
        );
        break;
    }
  }

  return (
    <Layout title="Bank Statement" showButton={false}>
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

export default BankStatementUpload;

import { useVisibleTabs } from "../../../hooks/useVisibleTabs";
import Tabs from "../../../components/layout/Tab";
import {
  ChevronsLeftRightEllipsis,
  UploadCloud,
  FileEdit,
  List,
} from "lucide-react";

import Layout from "../../../components/layout/Layout";
import BankBalanceForm from "./BankBalanceForm";
import AllBankBalancePage from "./AllBankBalance";
import Upload from "./BankBalanceUpload";
import { usePermissions } from "../../../hooks/useMasterPermission";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "../../../components/layout/LoadingSpinner";
const BankBalance = () => {
   const location = useLocation();
  const visibility = usePermissions("bank-balance");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "Bank Balance All",
      icon: List,
      visibility: visibility.allTab,
    },
    {
      id: "form",
      label: "Manual Entry Form",
      icon: FileEdit,
      visibility: visibility.manualEntryForm,
    },
    {
      id: "Upload",
      label: "Bank Balance Upload",
      icon: UploadCloud,
      visibility: visibility.uploadTab,
    },
    {
      id: "add",
      label: "Bank Balance ERP",
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
  // let currentContent = (
  //   <div className="p-4 text-gray-600">No accessible tabs available.</div>
  // );
  if (activeTab) {
    switch (activeTab) {
      case "form":
        currentContent = <BankBalanceForm />;
        break;
      case "Upload":
        currentContent = <Upload />;
        break;
      //   case "add":
      //     currentContent = <ERP />;
      //     break;
      case "All":
        currentContent = <AllBankBalancePage />;
        break;
        default:
        currentContent = (
          <div className="p-4 text-gray-600">No tab available</div>
        );
        break;
    }
  }

  return (
    <Layout title="Bank Balance" showButton={false}>
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

export default BankBalance;

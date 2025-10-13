
import { ChevronsLeftRightEllipsis, FileEdit, List, UploadCloud } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import BankMaster from "./BankMaster.tsx";
import AllBankAccounts from "./AllBank.tsx";
import UploadFile from "./BankMasterUpload.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";


const BankAccountTab = () => {
  const Visibility = usePermissions("bank-master");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Bank",
      icon: List ,
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
      label: "Bank Master Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
    },
    {
      id: "add",
      label: "Bank Master ERP",
      icon: ChevronsLeftRightEllipsis,
      visibility: Visibility.erpTab,
    },
  ];


  const location = useLocation();
  const initialTab = location.state && location.state.from === "form" ? "form" : "All";
  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    initialTab
  );

  let currentContent = (
    <div className="p-4 text-gray-600">No accessible tabs available.</div>
  );
  if (activeTab) {
    switch (activeTab) {
      case "All":
        currentContent = <AllBankAccounts />;
        break;
      case "form":
        currentContent = <BankMaster />;
        break;
      case "Upload":
        currentContent = <UploadFile />;
    }
  }

  return (
    <Layout title="Bank Master">
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

export default BankAccountTab;

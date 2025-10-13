// import React, { useEffect } from "react";
import {
  ChevronsLeftRightEllipsis,
  FileEdit,
  List,
  UploadCloud,
} from "lucide-react";

import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import BankAccountMaster from "./BankAccountMasterForm.tsx";
import AllBankAccounts from "./AllBankAccounts";
import UploadFile from "./BankAccountUpload.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
// import Upload from "./upload.tsx";
// import Form from "./form.tsx";
// import ERP from "./erp.tsx";

const BankAccountMasterTab = () => {
  const Visibility = usePermissions("bank-account-master");

  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Bank Accounts",
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
      label: "Bank Accounts Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
    },
    {
      id: "add",
      label: "Bank Accounts ERP",
      icon: ChevronsLeftRightEllipsis,
      visibility: Visibility.erpTab,
    },
  ];

  const { activeTab, switchTab, isActiveTab } = useVisibleTabs(
    TAB_CONFIG,
    "Form"
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
        currentContent = <BankAccountMaster />;
        break;
      case "Upload":
        currentContent = <UploadFile />;
        break;
      // case "ERP":
      //   currentContent = <ERP />;
      //   break;
    }
  }

  return (
    <Layout title="Bank Account Master">
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

export default BankAccountMasterTab;

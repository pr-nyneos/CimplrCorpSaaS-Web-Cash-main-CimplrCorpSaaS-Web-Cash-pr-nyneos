import { ChevronsLeftRightEllipsis, List, FileEdit, UploadCloud } from "lucide-react";

import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import Upload from "./glAccountMasterUpload.tsx";
import Form from "./GLAccountMaster.tsx";
import ERP from "./glAccountMasterErp.tsx";
// import AllBankAccounts from "./AllGLAccountMaster.tsx";
import AllGLAccount from "./AllGlAccount.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const GLMasterScreen = () => {
  const Visibility = usePermissions("gl-account-master");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All GL Account List",
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
      label: "GL Account Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
    },
    {
      id: "add",
      label: "GL Account ERP",
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
        currentContent = <AllGLAccount />;
        break;
    }
  }

  return (
    <Layout title="GL Account Master">
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

export default GLMasterScreen;


import { ChevronsLeftRightEllipsis, FileEdit, List } from "lucide-react";

import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import CurrencyMaster from "./CurrencyMaster.tsx";
import AllCurrency from "./AllCurrency";
// import UploadFile from "./CurrencyMasterUpload.tsx";
import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const CurrencyTab = () => {
  const Visibility = usePermissions("currency-master");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Currencies",
      icon: List,
      visibility: Visibility.allTab,
    },
    {
      id: "form",
      label: "Manual Entry Form",
      icon: FileEdit,
      visibility: Visibility.manualEntryForm,
      // visibility: true,
    },
    // {
    //   id: "Upload",
    //   label: "Currency Upload",
    //   icon: UploadCloud,
    //   visibility: true,
    // },
    {
      id: "add",
      label: "Currency ERP",
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
        currentContent = <AllCurrency />;
        break;
      case "form":
        currentContent = <CurrencyMaster />;
        break;
      // case "Upload":
      //   currentContent = <UploadFile />;
      //   break;
    }
  }

  return (
    <Layout title="Currency Master">
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

export default CurrencyTab;

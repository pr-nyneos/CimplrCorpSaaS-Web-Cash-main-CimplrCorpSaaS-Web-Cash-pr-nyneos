import {
  ChevronsLeftRightEllipsis,
  FileEdit,
  List,
  UploadCloud,
} from "lucide-react";

import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import Upload from "./counterPartyMasterUpload.tsx";
import Form from "./CounterPartyMaster.tsx";
import ERP from "./counterPartyMasterErp.tsx";
import AllCounterPartyMaster from "./AllCounteryPartyMaster.tsx";

import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
const CounterPartyScreen = () => {
  const Visibility = usePermissions("counterparty-master");
  const TAB_CONFIG = [
    {
      id: "All",
      label: "All Counterparty List",
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
      label: "Counterparty Upload",
      icon: UploadCloud,
      visibility: Visibility.uploadTab,
    },
    {
      id: "add",
      label: "Counterparty ERP",
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
        currentContent = <AllCounterPartyMaster />;

        break;
    }
  }

  return (
    <Layout title="Counterparty Master">
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

export default CounterPartyScreen;

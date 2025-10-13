import { useVisibleTabs } from "../../../hooks/useVisibleTabs";
import Tabs from "../../../components/layout/Tab";
import { Contrast, FileEdit, UploadCloud } from "lucide-react";

import Layout from "../../../components/layout/Layout";
import Upload from "./Upload";
import Form from "./Form";
import ERP from "./Erp";
import AllPayable from "./AllPayable";
import AllReceivable from "./AllReceivable";

const TransactionScreen = () => {
  const TAB_CONFIG = [
    {
      id: "Form",
      label: "Transaction Manual Entry",
      icon: FileEdit,
      visibility: true,
    },
    {
      id: "Upload",
      label: "Transaction Upload",
      icon: UploadCloud,
      visibility: true,
    },
    {
      id: "add",
      label: "Transaction ERP",
      icon: Contrast,
      visibility: true, 
    },
    {
      id: "All",
      label: "All Payable List",
      icon: FileEdit,
      visibility: true,
    },
    {
      id: "AllReceivable",
      label: "All Receivable List",
      icon: FileEdit,
      visibility: true,
    }
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
        currentContent = <AllPayable />;
        break;
      case "AllReceivable":
        currentContent = <AllReceivable />;
        break;
    }
  }

  return (
    <Layout title="Cash Transaction Upload" showButton={false}>
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

export default TransactionScreen;

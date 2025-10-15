import { useEffect, useState } from "react";
import { ChevronsLeftRightEllipsis, FileEdit, List } from "lucide-react";
import { useVisibleTabs } from "../../../hooks/useVisibleTabs.tsx";
import Tabs from "../../../components/layout/Tab.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import CurrencyMaster from "./CurrencyMaster.tsx";
import AllCurrency from "./AllCurrency";
import { usePermissions } from "../../../hooks/useMasterPermission.tsx";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
import { useLocation } from "react-router-dom";

const CurrencyTab = () => {
  const location = useLocation();
  const Visibility = usePermissions("currency-master");
  const [pageLoading, setPageLoading] = useState(true);

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
    },
    {
      id: "add",
      label: "Currency ERP",
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

  // Hide loader when permissions ready (for non-API tabs)
  useEffect(() => {
    if (Visibility) {
      // For "form" tab, no async data needed
      if (initialTab !== "All") setPageLoading(false);
    }
  }, [Visibility, initialTab]);

  // Callback when child data is done loading
  const handleDataLoaded = () => setPageLoading(false);

  // ---- Global Loading Spinner ----
  if (pageLoading || !Visibility) {
    return (
      <Layout title="Currency Master">
        <div className="flex justify-center items-center h-[75vh]">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  let currentContent;
  switch (activeTab) {
    case "All":
      currentContent = <AllCurrency onDataLoaded={handleDataLoaded} />;
      break;
    case "form":
      currentContent = <CurrencyMaster />;
      break;
    default:
      currentContent = (
        <div className="p-4 text-gray-600">No tab available</div>
      );
  }

  return (
    <Layout title="Currency Master">
      <div className="mb-6 pt-4">
        <Tabs tabs={TAB_CONFIG} switchTab={switchTab} isActiveTab={isActiveTab} />
      </div>
      <div
  className={`transition-opacity duration-500 ${
    pageLoading ? "opacity-0" : "opacity-100"
  }`}
>
  {currentContent}
</div>
    </Layout>
  );
};

export default CurrencyTab;


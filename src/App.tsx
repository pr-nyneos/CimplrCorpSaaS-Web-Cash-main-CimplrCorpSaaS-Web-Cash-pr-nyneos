import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./app/providers/ThemeProvider/ThemeContext.tsx";
import ForgotPassword from "./features/auth/Validation/ForgotPassword.tsx";
import PreloaderAnimation from "../src/components/ui/Preloader.tsx";
import NotificationProvider from "./app/providers/NotificationProvider/Notification.tsx";
//

// const Users = lazy(() => import("./client/uam/Users"));
// const UserCreationForm = lazy(
//   () => import("./client/uam/Users/UserCreationForm")
// );
// const Roles = lazy(() => import("./client/uam/Roles/index"));
// const RoleCreation = lazy(() => import("./client/uam/Roles/RoleCreationForm"));
// const FxWizard = lazy(() => import("./client/fx/fxWizard/index.tsx"));
// const OutputTabs = lazy(() => import("./client/fx/fxWizard/outputIndex.tsx"));
// const MTMRateInput = lazy(
//   () => import("./client/MTMRateInput/MTMRateInput")
// );
// const MTMCalculator = lazy(
//   () => import("./client/MTMCalculator/MTMCalculator")
// );
// const MTMUploader = lazy(
//   () => import("./client/MTMCalculator/MTMUploader.tsx")
// );
// const Permission = lazy(() => import("./client/uam/Permission/index"));

// const Hedgingproposal = lazy(
//   () => import("./client/fx/hedgingproposal/index.tsx")
// );
// const Entity = lazy(() => import("./client/entity/EntityCreation"));
// const Hierarchical = lazy(() => import("./client/entity/entityHiearchy"));
// const CFODashboard = lazy(
//   () => import("./client/CFODashboard/CFODashboard.tsx")
// );
// const OPSDashboard = lazy(
//   () => import("./client/OPSDashboard/OPSDashboard.tsx")
// );
// const NetExposure = lazy(
//   () => import("./client/fx/NetPosition/netPosition.tsx")
// );
// const FxConfirmationPage = lazy(
//   () => import("./client/fx/fxConfirmation/index.tsx")
// );
// const LinkingScreen = lazy(() => import("./client/linkingScreen/Exp/exp1.tsx"));
// const FxForward = lazy(() => import("./client/fx/fxForward/index.tsx"));
// const FxCancellation = lazy(
//   () => import("./client/fx/fxCancellation/index.tsx")
// );
// const CFODashboardBuilder = lazy(
//   () => import("./client/DashboardBuilder/DashboardBuilder.tsx")
// );
// const Reports = lazy(() => import("./client/Reports/Reports.tsx"));
// const PaymentRollover = lazy(() => import("./client/Settlement/index.tsx"));
// const ExposureSelection = lazy(
//   () => import("./client/Settlement/ExposureSelection.tsx")
// );

// Masters
const CurrencyMaster = lazy(
  () => import("./features/masters/currencyMaster/index")
);
const PayableReceivableMaster = lazy(
  () => import("./features/masters/payableReceivableMaster/index.tsx")
);
const CashFlowCategoryMaster = lazy(
  () => import("./features/masters/cashFlowCategoryMaster/index.tsx")
);
const BankAccountMaster = lazy(
  () => import("./features/masters/bankAccountMaster/index.tsx")
);
const CostProfitCenterMaster = lazy(
  () => import("./features/masters/costProfitCenterMaster/index.tsx")
);
const EntityMasterScreen = lazy(
  () => import("./features/masters/entitymaster/index.tsx")
);
const GLMasterScreen = lazy(
  () => import("./features/masters/glAccountMaster/index.tsx")
);
const CounterPartyScreen = lazy(
  () => import("./features/masters/counterPartyMaster/index.tsx")
);
const AllCounterpartyBankRow = lazy(
  () => import("./features/masters/counterPartyMaster/AllCounterPartyBank.tsx")
);

// Cash Management
const BankBalance = lazy(() => import("./features/cash/bankBalance/index"));
const BankMaster = lazy(() => import("./features/masters/bankMaster/index"));
const BankStatementUpload = lazy(
  () => import("./features/cash/bankStatement/index.tsx")
);
const EditProjection = lazy(
  () => import("./features/cash/projection/EditProjection.tsx")
);
const TransactionScreen = lazy(
  () => import("./features/cash/transaction/index.tsx")
);
const ProposalScreen = lazy(() => import("./features/cash/proposal/index.tsx"));
const Projection = lazy(() => import("./features/cash/projection/index.tsx"));
const FundAvailability = lazy(
  () => import("./features/cash/fundAvailability/FundAvailability.tsx")
);

const AllFundPlanningRow = lazy(
  () => import("./features/cash/fundPlanning/FundPlanningDetail.tsx")
);

import BankAccountDetail from "./features/masters/bankAccountMaster/BankMasterDetali.tsx";
import SweepPlanning from "./features/cash/sweepPlaning.tsx/index.tsx";
// import FundPlanning from "./features/cash/fundPlanning/FundPlanning.tsx";

const FundPlanningTab = lazy(
  () => import("./features/cash/fundPlanning/index.tsx")
);

const ExposureCreationTab = lazy(
  () => import("./features/fx/exposure/exposureCreation/index.tsx")
);

const FxConfirmationBooking = lazy(
  () => import("./features/fx/forwards/fxConfirmation/index.tsx")
);

// FX
const FxForwardBooking = lazy(
  () => import("./features/fx/forwards/fxForwardBooking/index.tsx")
);

// Dashboards
const BankBalancesDashboard = lazy(
  () => import("./features/cashDashboard/BankBalancesDashboard.tsx")
);
const DemoBankBalancesDashboard = lazy(
  () => import("./features/cashDashboard/DemoBankBalancesDashboard.tsx")
);
const DemoProjectionPipelineDashboard = lazy(
  () => import("./features/cashDashboard/DemoProjectionPipelineDashboard.tsx")
);
const DemoPlannedInflowOutflowDashboard = lazy(
  () => import("./features/cashDashboard/DemoPlannedInflowOutflowDashboard.tsx")
);
const Liquidity = lazy(() => import("./features/cashDashboard/Liquidity.tsx"));
const ForecastActualDashboard = lazy(
  () => import("./features/cashDashboard/forecastActualDashboard")
);
const CashFlowForecastDashboard = lazy(
  () => import("./features/cashDashboard/cashFlowForecastDashboard.tsx")
);
const ProjectionPipelineDashboard = lazy(
  () => import("./features/cashDashboard/ProjectionPipelineDashboard.tsx")
);


const PayableReceivablesForecast = lazy(
  () => import("./features/cashDashboard/PayablesReceivablesForecast.tsx")
);
const PlannedInflowOutflowDashboard = lazy(
  () => import("./features/cashDashboard/PlannedInflowOutflowDashboard.tsx")
);
const TreasuryComplianceAndRiskMetricsDashboard = lazy(
  () =>
    import(
      "./features/cashDashboard/TreasuryComplianceAndRiskMetricsDashboard.tsx"
    )
);

const ExposureUpload = lazy(
  () => import("./features/fx/exposure/exposureUpload/index.tsx")
);

const ExposureBucketing = lazy(
  () => import("./features/fx/exposure/exposureBucketing/index")
);

const HedgingProposal = lazy(
  () => import("./features/fx/exposure/hedgingProposal/HedgingProposal.tsx")
);

// UAM
const Permission = lazy(() => import("./features/uam/permission/index.tsx"));
const Roles = lazy(() => import("./features/uam/roles/index.tsx"));
const Users = lazy(() => import("./features/uam/users/index.tsx"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PreloaderAnimation />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Cash Management */}
              <Route path="/bank-balance" element={<BankBalance />} />
              <Route path="/proposal" element={<ProposalScreen />} />
              <Route path="/bank-statement" element={<BankStatementUpload />} />
              <Route path="/transaction" element={<TransactionScreen />} />
              <Route
                path="/projection/edit-projection"
                element={<EditProjection />}
              />
              <Route
                path="/bank-account-detail"
                element={<BankAccountDetail />}
              />
              <Route path="/fund-planning" element={<FundPlanningTab />} />
              <Route path="/fund-planning/detail" element={<AllFundPlanningRow />} />
              <Route path="/fund-availability" element={<FundAvailability />} />
              <Route path="/projection" element={<Projection />} />
              {/* <Route path="/exposure-upload" element={<ExposureUpload />} /> */}
              <Route path="/sweep-planning" element={<SweepPlanning />} />

              {/* Masters */}
              <Route path="/bank-master" element={<BankMaster />} />

              <Route path="/currency-master" element={<CurrencyMaster />} />
              <Route
                path="/payable-receivable-master"
                element={<PayableReceivableMaster />}
              />
              <Route path="/gl-account-master" element={<GLMasterScreen />} />
              <Route
                path="/cash-flow-category-master"
                element={<CashFlowCategoryMaster />}
              />
              <Route
                path="/counterparty-master"
                element={<CounterPartyScreen />}
              />
              <Route
                path="/counterparty/counterparty-bank"
                element={<AllCounterpartyBankRow />}
              />
              <Route
                path="/fx-forward-booking"
                element={<FxForwardBooking />}
              />
              <Route
                path="/fx-confirmation-booking"
                element={<FxConfirmationBooking />}
              />
              <Route
                path="/bank-account-master"
                element={<BankAccountMaster />}
              />
              <Route path="/entity-master" element={<EntityMasterScreen />} />
              <Route
                path="/cost-profit-center-master"
                element={<CostProfitCenterMaster />}
              />
              
              <Route
                path="/payable-receivables-forecast"
                element={<PayableReceivablesForecast />}
              />

              {/* Dashboard */}
              <Route path="/liquidity" element={<Liquidity />} />
              <Route
                path="/forecast-actual-dashboard"
                element={<ForecastActualDashboard />}
              />
              <Route
                path="/cash-dashboard"
                element={<BankBalancesDashboard />}
              />
              <Route
                path="/demo-bank-balances-dashboard"
                element={<DemoBankBalancesDashboard />}
              />
              <Route
                path="/demo-projection-pipeline-dashboard"
                element={<DemoProjectionPipelineDashboard />}
              />
              <Route
                path="/demo-planned-inflow-outflow-dashboard"
                element={<DemoPlannedInflowOutflowDashboard />}
              />
              <Route
                path="/cashflow-forecast-dashboard"
                element={<CashFlowForecastDashboard />}
              />
              <Route
                path="/planned-inflow-outflow-dashboard"
                element={<PlannedInflowOutflowDashboard />}
              />
              <Route
                path="/projection-pipeline-dashboard"
                element={<ProjectionPipelineDashboard />}
              />
              <Route
                path="/treasury-compliance-risk-metrics-dashboard"
                element={<TreasuryComplianceAndRiskMetricsDashboard />}
              />
              <Route path="/projection" element={<Projection />} />
              <Route path="/sweep-planning" element={<SweepPlanning />} />

              {/* UAM */}
              <Route path="/permission" element={<Permission />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/users" element={<Users />} />
              
              <Route
                path="/exposure-upload"
                element={<ExposureUpload />}
              />

              <Route
                path="/exposure-bucketing"
                element={<ExposureBucketing />}
              />

              <Route
                path="/exposure-creation"
                element={<ExposureCreationTab />}
              />

              <Route
                path="/hedging-proposal"
                element={<HedgingProposal />}
              />

              {/* <Route
                path="/cfo-dashboard-builder"
                element={<CFODashboardBuilder />}
              />
              <Route path="/exposure-upload" element={<ExposureUpload />} />
              <Route
                path="/exposure-bucketing"
                element={<ExposureBucketing />}
              />
              <Route path="/hedging-proposal" element={<Hedgingproposal />} />
              <Route path="/settlement" element={<PaymentRollover />} />
              <Route
                path="/exposure-selection"
                element={<ExposureSelection />}
              /> */}
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </NotificationProvider>
  );
}

export default App;

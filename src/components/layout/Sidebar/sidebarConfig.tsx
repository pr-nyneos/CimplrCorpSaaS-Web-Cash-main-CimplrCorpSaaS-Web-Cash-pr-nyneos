import {
  UserRoundCog,
  HandCoins,
  // UserPlus,
  FileBarChart,
  // ChartArea,
  SquareChartGantt,
  LayoutDashboard,
  Proportions,
  Landmark,
  Upload,
  BarChart2,
  FileText,
  FileSymlink,
  Receipt,
  BookUp,
  CheckCircle,
  CircleX,
  // Store,
  // Calculator,
  // ChevronsLeftRightEllipsis,
  // Handshake,
  LogOut,
  Settings,
  // Building,
  // Layers,
  // ShieldUser,
  CircleDollarSign,
  IdCardLanyard,
  ChartGantt,
  BadgeIndianRupee,
  TrendingUpDown,
  UserPlus,
} from "lucide-react";
import React from "react";

export type NavItem = {
  label: string;
  path?: string;
  icon: React.ReactNode;
  subItems?: NavItem[];
};

export const sidebarConfig: Record<string, NavItem[]> = {
  // Dashboard: [
  //   // { label: "Entity", path: "/entity", icon: <Building /> },
  //   // { label: "Entity hierarchy", path: "/hierarchical", icon: <Layers /> },
  //   // {
  //   //   label: "Settings",
  //   //   icon: <Settings />,
  //   //   subItems: [
  //   //     { label: "Roles", path: "/role", icon: <UserRoundCog /> },
  //   //     { label: "Permissions", path: "/permission", icon: <HandCoins /> },
  //   //     { label: "Users", path: "/user", icon: <UserPlus /> },
  //   //   ],
  //   // },
  //   {
  //     label: "Dashboard",
  //     icon: <FileBarChart />,
  //     subItems: [
  //       // { label: "CFO Dashboard", path: "/cfo-dashboard", icon: <ChartArea /> },
  //       // {
  //       //   label: "FX Ops Dashboard",
  //       //   path: "/ops-dashboard",
  //       //   icon: <SquareChartGantt />,
  //       // },
  //       // {
  //       //   label: "Hedging Dashboard",
  //       //   path: "/hedging-dashboard",
  //       //   icon: <LayoutDashboard />,
  //       // },
  //       // {
  //       //   label: "Dashboard Builder",
  //       //   path: "/cfo-dashboard-builder",
  //       //   icon: <Proportions />,
  //       // },
  //       {
  //         label: "Cash : Bank Balances Dashboard",
  //         path: "/cash-dashboard",
  //         icon: <FileBarChart />,
  //       },
  //     ],
  //   },
  //   { label: "Logout", icon: <LogOut />, path: "__logout__" },
  // ],
  "Cash Management": [
    {
      label: "Bank Statement Uploader",
      path: "/bank-statement",
      icon: <Upload />,
    },
    {
      label: "Bank Balance",
      path: "/bank-balance",
      icon: <CheckCircle />,
    },
    {
      label: "Transaction",
      path: "/transaction",
      icon: <Receipt />,
    },
    {
      label: "Fund Planning",
      path: "/fund-planning",
      icon: <FileText />,
    },
    {
      label: "Sweep Planning",
      path: "/sweep-planning",
      icon: <IdCardLanyard />,
    },

    // {
    //   label: "Proposal",
    //   path: "/proposal",
    //   icon: <FileText />,
    // },
    {
      label: "Projection",
      path: "/projection",
      icon: <BarChart2 />,
    },

    {
      label: "Dashboard",
      icon: <FileBarChart />,
      subItems: [
        // { label: "CFO Dashboard", path: "/cfo-dashboard", icon: <ChartArea /> },
        // {
        //   label: "FX Ops Dashboard",
        //   path: "/ops-dashboard",
        //   icon: <SquareChartGantt />,
        // },
        // {
        //   label: "Hedging Dashboard",
        //   path: "/hedging-dashboard",
        //   icon: <LayoutDashboard />,
        // },
        // {
        //   label: "Dashboard Builder",
        //   path: "/cfo-dashboard-builder",
        //   icon: <Proportions />,
        // },

        {
          label: "Bank Balance Dashboard",
          path: "/cash-dashboard",
          icon: <SquareChartGantt />,
        },
        {
          label: "Payable Receivable Dashboard",
          path: "/payable-receivables-forecast",
          icon: <Proportions />,
        },

        {
          label: "Planned Inflow Outflow Dashboard",
          path: "/planned-inflow-outflow-dashboard",
          icon: <ChartGantt />,
        },
        {
          label: "Projection Pipeline Dashboard",
          path: "/projection-pipeline-dashboard",
          icon: <LayoutDashboard />,
        },
        {
          label: "Cashflow Forecast Dashboard",
          path: "/cashflow-forecast-dashboard",
          icon: <SquareChartGantt />,
        },

        {
          label: "Liquidity Dashboard",
          path: "/liquidity",
          icon: <FileBarChart />,
        },
        {
          label: "Forecast vs Actual Dashboard",
          path: "/forecast-actual-dashboard",
          icon: <TrendingUpDown />,
        },

        {
          label: "Treasury Compliance and Risk Metrics Dashboard",
          path: "/treasury-compliance-risk-metrics-dashboard",
          icon: <BadgeIndianRupee />,
        },
      ],
    },
    {
      label: "Fund Availability",
      path: "/fund-availability",
      icon: <CircleDollarSign />,
    },
  ],

  //  {
  //    label: "Cash Management",
  //    icon: <FileBarChart />,
  //    subItems: [
  //      { label: "Cash : Bank Balances Dashboard", path: "/cash-dashboard", icon: <FileBarChart /> },
  //    ],
  //  },
  //   {
  //     label: "Exposure",
  //     icon: <Landmark />,
  //     subItems: [
  //       {
  //         label: "Exposure Upload",
  //         path: "/exposure-upload",
  //         icon: <Upload />,
  //       },
  //       {
  //         label: "Exposure Bucketing",
  //         path: "/exposure-bucketing",
  //         icon: <BarChart2 />,
  //       },
  //       {
  //         label: "Hedging Proposal",
  //         path: "/hedging-proposal",
  //         icon: <FileText />,
  //       },
  //       {
  //         label: "Exposure Linkage",
  //         path: "/linking-screen",
  //         icon: <FileSymlink />,
  //       },
  //     ],
  //   },
  //   {
  //     label: "Forwards",
  //     icon: <Receipt />,
  //     subItems: [
  //       { label: "FX Forward Booking", path: "/fxbooking", icon: <BookUp /> },
  //       {
  //         label: "FX Confirmation",
  //         path: "/fx-confirmation",
  //         icon: <CheckCircle />,
  //       },
  //       {
  //         label: "FX Cancellation & Rollover",
  //         path: "/fx-wizard",
  //         icon: <CircleX />,
  //       },
  //     ],
  //   },
  //   {
  //     label: "MTM Screens",
  //     icon: <Store />,
  //     subItems: [
  //       {
  //         label: "MTM Calculator",
  //         path: "/mtm-calculator",
  //         icon: <Calculator />,
  //       },
  //       {
  //         label: "MTM Rates Input",
  //         path: "/mtm-rate-input",
  //         icon: <ChevronsLeftRightEllipsis />,
  //       },
  //       { label: "MTM Uploader", path: "/mtm-upload", icon: <Upload /> },
  //     ],
  //   },
  //   { label: "Reports", path: "/reports", icon: <Proportions /> },
  //   { label: "Settlement", path: "/exposure-selection", icon: <Handshake /> },
  //   { label: "Logout", icon: <LogOut />, path: "__logout__" },
  // ],

  "FX Hedging": [
    // { label: "Entity", path: "/entity", icon: <Building /> },
    // { label: "Entity hierarchy", path: "/hierarchical", icon: <Layers /> },
    // {
    //   label: "Settings",
    //   icon: <Settings />,
    //   subItems: [
    //     { label: "Roles", path: "/role", icon: <UserRoundCog /> },
    //     { label: "Permissions", path: "/permission", icon: <HandCoins /> },
    //     { label: "Users", path: "/user", icon: <UserPlus /> },
    //   ],
    // },
    // {
    //   label: "Masters",
    //   icon: <ShieldUser />,
    //   subItems: [
    //     {
    //       label: "Currency Master",
    //       path: "/currency-master",
    //       icon: <CircleDollarSign />,
    //     },
    //     { label: "Bank Master", path: "/bank-master", icon: <Landmark /> },
    //     {
    //       label: "Payable Receivable Master",
    //       path: "/payable-receivable-master",
    //       icon: <HandCoins />,
    //     },
    //     {
    //       label: "CashFlow Category Master",
    //       path: "/cash-flow-category-master",
    //       icon: <BarChart2 />,
    //     },
    //     {
    //       label: "Bank Account Master",
    //       path: "/bank-account-master",
    //       icon: <Receipt />,
    //     },
    //     {
    //       label: "Counterparty Master",
    //       path: "/counterparty-master",
    //       icon: <UserRoundCog />,
    //     }, // Counterparty
    //     {
    //       label: "GL Account Master",
    //       path: "/gl-account-master",
    //       icon: <FileText />,
    //     }, // GL Account
    //     {
    //       label: "Cost/Profit Centre Master",
    //       path: "/cost-profit-centre-master",
    //       icon: <BarChart2 />,
    //     }, // Cost/Profit Centre
    //   ],
    // },
    // {
    //   label: "Dashboard",
    //   icon: <FileBarChart />,
    //   subItems: [
    //     { label: "CFO Dashboard", path: "/cfo-dashboard", icon: <ChartArea /> },
    //     {
    //       label: "FX Ops Dashboard",
    //       path: "/ops-dashboard",
    //       icon: <SquareChartGantt />,
    //     },
    //     {
    //       label: "Hedging Dashboard",
    //       path: "/hedging-dashboard",
    //       icon: <LayoutDashboard />,
    //     },
    //     {
    //       label: "Dashboard Builder",
    //       path: "/cfo-dashboard-builder",
    //       icon: <Proportions />,
    //     },
    //   ],
    // },
    {
      label: "Exposure",
      icon: <Landmark />,
      subItems: [
        {
          label: "Exposure Upload",
          path: "/exposure-upload",
          icon: <Upload />,
        },
        {
          label: "Exposure Bucketing",
          path: "/exposure-bucketing",
          icon: <BarChart2 />,
        },
        {
          label: "Hedging Proposal",
          path: "/hedging-proposal",
          icon: <FileText />,
        },
        {
          label: "Exposure Linkage",
          path: "/linking-screen",
          icon: <FileSymlink />,
        },
      ],
    },
    {
      label: "Forwards",
      icon: <Receipt />,
      subItems: [
        {
          label: "FX Forward Booking",
          path: "/fx-forward-booking",
          icon: <BookUp />,
        },
        {
          label: "FX Confirmation",
          path: "/fx-confirmation-booking",
          icon: <CheckCircle />,
        },
        {
          label: "FX Cancellation & Rollover",
          path: "/fx-wizard",
          icon: <CircleX />,
        },
      ],
    },
    // {
    //   label: "MTM Screens",
    //   icon: <Store />,
    //   subItems: [
    //     {
    //       label: "MTM Calculator",
    //       path: "/mtm-calculator",
    //       icon: <Calculator />,
    //     },
    //     {
    //       label: "MTM Rates Input",
    //       path: "/mtm-rate-input",
    //       icon: <ChevronsLeftRightEllipsis />,
    //     },
    //     { label: "MTM Uploader", path: "/mtm-upload", icon: <Upload /> },
    //   ],
    // },
    // { label: "Reports", path: "/reports", icon: <Proportions /> },
    // { label: "Settlement", path: "/exposure-selection", icon: <Handshake /> },
    { label: "Logout", icon: <LogOut />, path: "__logout__" },
  ],

  "Bank Guarantee": [
    { label: "Guarantee Upload", path: "/guarantee-upload", icon: <Upload /> },
    {
      label: "Guarantee Reports",
      path: "/guarantee-reports",
      icon: <FileText />,
    },
    { label: "Logout", icon: <LogOut />, path: "__logout__" },
  ],

  Settings: [
    // { label: "Entity", path: "/entity", icon: <Building /> },
    // { label: "Entity hierarchy", path: "/hierarchical", icon: <Layers /> },
    {
      label: "UAM",
      icon: <Settings />,
      subItems: [
        { label: "Roles", path: "/roles", icon: <UserRoundCog /> },
        { label: "Permissions", path: "/permission", icon: <HandCoins /> },
        { label: "Users", path: "/users", icon: <UserPlus /> },
      ],
    },

    {
      label: "Entity master",
      path: "/entity-master",
      icon: <IdCardLanyard />,
    },
    {
      label: "Currency Master",
      path: "/currency-master",
      icon: <CircleDollarSign />,
    },
    { label: "Bank Master", path: "/bank-master", icon: <Landmark /> },
    {
      label: "Payable Receivable Master",
      path: "/payable-receivable-master",
      icon: <HandCoins />,
    },
    {
      label: "CashFlow Category Master",
      path: "/cash-flow-category-master",
      icon: <BarChart2 />,
    },
    {
      label: "Bank Account Master",
      path: "/bank-account-master",
      icon: <Receipt />,
    },
    {
      label: "Counterparty Master",
      path: "/counterparty-master",
      icon: <UserRoundCog />,
    }, // Counterparty
    {
      label: "GL Account Master",
      path: "/gl-account-master",
      icon: <FileText />,
    }, // GL Account
    {
      label: "Cost/Profit Centre Master",
      path: "/cost-profit-center-master",
      icon: <BarChart2 />,
    }, // Cost/Profit Centre

    // {
    //   label: "Dashboard",
    //   icon: <FileBarChart />,
    //   subItems: [
    //     { label: "CFO Dashboard", path: "/cfo-dashboard", icon: <ChartArea /> },
    //     {
    //       label: "FX Ops Dashboard",
    //       path: "/ops-dashboard",
    //       icon: <SquareChartGantt />,
    //     },
    //     {
    //       label: "Hedging Dashboard",
    //       path: "/hedging-dashboard",
    //       icon: <LayoutDashboard />,
    //     },
    //     {
    //       label: "Dashboard Builder",
    //       path: "/cfo-dashboard-builder",
    //       icon: <Proportions />,
    //     },
    //   ],
    // },
    // {
    //   label: "Exposure",
    //   icon: <Landmark />,
    //   subItems: [
    //     {
    //       label: "Exposure Upload",
    //       path: "/exposure-upload",
    //       icon: <Upload />,
    //     },
    //     {
    //       label: "Exposure Bucketing",
    //       path: "/exposure-bucketing",
    //       icon: <BarChart2 />,
    //     },
    //     {
    //       label: "Hedging Proposal",
    //       path: "/hedging-proposal",
    //       icon: <FileText />,
    //     },
    //     {
    //       label: "Exposure Linkage",
    //       path: "/linking-screen",
    //       icon: <FileSymlink />,
    //     },
    //   ],
    // },
    // {
    //   label: "Forwards",
    //   icon: <Receipt />,
    //   subItems: [
    //     { label: "FX Forward Booking", path: "/fxbooking", icon: <BookUp /> },
    //     {
    //       label: "FX Confirmation",
    //       path: "/fx-confirmation",
    //       icon: <CheckCircle />,
    //     },
    //     {
    //       label: "FX Cancellation & Rollover",
    //       path: "/fx-wizard",
    //       icon: <CircleX />,
    //     },
    //   ],
    // },
    // {
    //   label: "MTM Screens",
    //   icon: <Store />,
    //   subItems: [
    //     {
    //       label: "MTM Calculator",
    //       path: "/mtm-calculator",
    //       icon: <Calculator />,
    //     },
    //     {
    //       label: "MTM Rates Input",
    //       path: "/mtm-rate-input",
    //       icon: <ChevronsLeftRightEllipsis />,
    //     },
    //     { label: "MTM Uploader", path: "/mtm-upload", icon: <Upload /> },
    //   ],
    // },
    // { label: "Reports", path: "/reports", icon: <Proportions /> },
    // { label: "Settlement", path: "/exposure-selection", icon: <Handshake /> },
    { label: "Logout", icon: <LogOut />, path: "__logout__" },
  ],
};

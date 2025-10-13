export type BankMasterForm = {
  processname: string;
  bankName: string;
  bankShortName: string;
  swiftBicCode: string;
  countryOfHeadquarters: string;
  connectivityType: string;
  activeStatus: string;
  bankContactName: string;
  bankContactEmail: string;
  bankContactPhone: string;
  bankAddressLine1: string;
  bankAddressLine2: string;
  bankCity: string;
  bankStateProvince: string;
  bankPostalCode: string;
};

export type CurrencyMaster = {
  code: string;          // Currency Code (e.g., "USD", "INR")
  name: string;          // Currency Name (e.g., "US Dollar", "Indian Rupee")
  country: string;       // Country (e.g., "United States", "India")
  symbol: string;        // Symbol (e.g., "$", "₹")
  decimalPlace: number;  // Decimal places (e.g., 2 for USD, 0 for JPY)
  status: "Active" | "Inactive"; // Status (restricted values)
};
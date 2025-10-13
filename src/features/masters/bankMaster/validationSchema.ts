// validationSchema.ts
import * as yup from "yup";

export const bankMasterSchema = yup.object().shape({
  bank_name: yup.string().required("Bank Name is required").max(100),
  bank_short_name: yup.string().max(50),
  swift_bic_code: yup
    .string()
    .matches(/^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/, "Must be 8 or 11 alphanumeric characters")
    .max(11),
  connectivity_type: yup
    .string()
    .notOneOf(["Choose..."], "Please select a valid connectivity type")
    .required("Connectivity Type is required"),
  active_status: yup
    .string()
    .notOneOf(["Choose..."], "Please select a valid status")
    .required("Active Status is required"),
  country_of_headquarters: yup.string().required("Please select a country"),
  contact_person_name: yup.string().max(100),
  contact_person_email: yup.string().email("Invalid email format"),
  contact_person_phone: yup
    .string()
    .matches(/^[0-9+\-]*$/, "Only numbers, +, - allowed"),
  address_line1: yup.string().max(100),
  address_line2: yup.string().max(100),
  city: yup.string().max(50),
  state_province: yup.string().max(50),
  postal_code: yup
    .string()
    .matches(/^[A-Za-z0-9]*$/, "Only alphanumeric allowed")
    .max(20),
});
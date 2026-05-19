import CustomersClient from "./CustomersClient";
import AdminProtected from "../admin-protected";

export default function CustomersPage() {
  return (
    <AdminProtected>
      <CustomersClient />
    </AdminProtected>
  );
}


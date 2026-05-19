import PaymentsClient from "./PaymentsClient";
import AdminProtected from "../admin-protected";

export default function PaymentsPage() {
  return (
    <AdminProtected>
      <PaymentsClient />
    </AdminProtected>
  );
}


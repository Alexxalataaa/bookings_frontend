import BookingsClient from "./BookingsClient";
import AdminProtected from "../admin-protected";

export default function BookingsPage() {
  return (
    <AdminProtected>
      <BookingsClient />
    </AdminProtected>
  );
}


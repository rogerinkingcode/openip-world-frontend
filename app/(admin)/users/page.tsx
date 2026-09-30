import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UsersView from "./users-view";

export const metadata: Metadata = {
  title: "Usuários",
};

export default function UsersPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Usuários" />
      <UsersView />
    </>
  );
}

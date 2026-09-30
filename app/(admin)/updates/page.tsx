import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UpdatesView from "./updates-view";

export const metadata: Metadata = {
  title: "Controle de atualizações",
};

export default function UpdatesPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Controle de atualizações" />
      <UpdatesView />
    </>
  );
}

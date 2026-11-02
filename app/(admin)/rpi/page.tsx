import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RpiView from "./rpi-view";

export const metadata: Metadata = {
  title: "Revista da Propriedade Industrial",
};

export default function RpiPage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Revista da Propriedade Industrial" />
      <RpiView />
    </>
  );
}

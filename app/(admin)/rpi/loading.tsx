import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { RpiSkeleton } from "./rpi-view";

export default function Loading() {
  return (
    <>
      <PageBreadcrumb pageTitle="Revista da Propriedade Industrial" />
      <RpiSkeleton />
    </>
  );
}

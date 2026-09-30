import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProfileSkeleton } from "./profile-view";

export default function Loading() {
  return (
    <>
      <PageBreadcrumb pageTitle="Perfil" />
      <ProfileSkeleton />
    </>
  );
}

import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProfileView from "./profile-view";

export const metadata: Metadata = {
  title: "Perfil",
};

export default function ProfilePage() {
  return (
    <>
      <PageBreadcrumb pageTitle="Perfil" />
      <ProfileView />
    </>
  );
}

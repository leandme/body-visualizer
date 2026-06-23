import { redirect } from "next/navigation";

type UploadPageParams = {
  imageUrl?: string;
};

export default async function UploadPage({
  searchParams,
}: {
  searchParams?: Promise<UploadPageParams>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const imageUrl = params?.imageUrl;

  if (imageUrl) {
    redirect("/pricing?uploaded=1");
  }

  redirect("/");
}

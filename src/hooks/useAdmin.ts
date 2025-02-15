import { useSession } from "next-auth/react";

export const useAdmin = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.email?.endsWith("@lacymorrow.com") ?? false;

  return { isAdmin };
};

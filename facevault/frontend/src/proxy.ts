import { clerkMiddleware } from "@clerk/nextjs/server";

// The dashboard is open to guests, who try FaceVault with a vault kept in their own
// browser. Signed-in users get their private vault on the server. Clerk still runs on
// every request so pages know who is signed in.
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};

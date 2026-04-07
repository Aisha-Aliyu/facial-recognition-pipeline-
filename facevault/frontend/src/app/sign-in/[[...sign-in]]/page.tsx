import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--void)" }}
    >
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#bfa27a",
            colorBackground: "#242020",
            colorText: "#f0ebe3",
            colorTextSecondary: "#9e9189",
            colorInputBackground: "#2e2929",
            colorInputText: "#f0ebe3",
            borderRadius: "0px",
            fontFamily: "DM Mono, monospace",
          },
          elements: {
            card: "shadow-none border border-[#bfa27a26]",
            headerTitle: "font-display text-[#f0ebe3]",
            headerSubtitle: "text-[#9e9189]",
            formButtonPrimary:
              "bg-[#bfa27a] text-[#1c1c1c] hover:opacity-90 rounded-none text-xs tracking-widest uppercase",
            formFieldInput:
              "bg-[#2e2929] border-[#bfa27a26] text-[#f0ebe3] rounded-none focus:border-[#bfa27a]",
            formFieldLabel: "text-[#9e9189] text-xs tracking-widest uppercase",
            footerActionLink: "text-[#bfa27a] hover:text-[#bfa27a]",
            dividerLine: "bg-[#bfa27a26]",
            dividerText: "text-[#6b6060]",
            socialButtonsBlockButton:
              "border-[#bfa27a26] bg-[#2e2929] text-[#f0ebe3] hover:bg-[#3a3333] rounded-none",
            socialButtonsBlockButtonText: "text-[#f0ebe3]",
            identityPreviewText: "text-[#f0ebe3]",
            identityPreviewEditButton: "text-[#bfa27a]",
          },
        }}
      />
    </main>
  );
}

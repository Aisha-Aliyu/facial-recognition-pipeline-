import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--void)" }}
    >
      <div className="grain-overlay" />

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(191,162,122,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(191,162,122,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Radial glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "700px",
          background:
            "radial-gradient(circle, rgba(191,162,122,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between border-b"
        style={{
          borderColor: "var(--gold-border)",
          padding: "20px 32px",
        }}
      >
        <div className="flex items-center gap-3">
          <svg
            width="28"
            height="28"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="64" height="64" rx="14" fill="#242020" />
            <circle cx="32" cy="26" r="10" stroke="#bfa27a" strokeWidth="2.5" fill="none" />
            <path
              d="M10 54c0-12.15 9.85-22 22-22s22 9.85 22 22"
              stroke="#bfa27a"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="8" y="8" width="12" height="3" rx="1.5" fill="#5a4e4e" />
            <rect x="8" y="8" width="3" height="12" rx="1.5" fill="#5a4e4e" />
            <rect x="44" y="8" width="12" height="3" rx="1.5" fill="#5a4e4e" />
            <rect x="53" y="8" width="3" height="12" rx="1.5" fill="#5a4e4e" />
            <rect x="8" y="53" width="12" height="3" rx="1.5" fill="#5a4e4e" />
            <rect x="8" y="44" width="3" height="12" rx="1.5" fill="#5a4e4e" />
            <rect x="44" y="53" width="12" height="3" rx="1.5" fill="#5a4e4e" />
            <rect x="53" y="44" width="3" height="12" rx="1.5" fill="#5a4e4e" />
          </svg>
          <span
            className="font-display text-xl tracking-wider"
            style={{ color: "var(--gold)" }}
          >
            FaceVault
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-xs tracking-widest uppercase border transition-all duration-300 hover:border-[#bfa27a] hover:text-[#bfa27a]"
            style={{
              borderColor: "var(--gold-border)",
              color: "var(--text-secondary)",
              padding: "10px 20px",
            }}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-xs tracking-widest uppercase transition-all duration-300 hover:opacity-90"
            style={{
              background: "var(--gold)",
              color: "var(--void)",
              fontWeight: 500,
              padding: "10px 20px",
            }}
          >
            Get Access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{ minHeight: "88vh", padding: "64px 24px" }}
      >
        <div
          className="opacity-0 animate-fade-up delay-1"
          style={{ animationFillMode: "forwards" }}
        >
          <span
            className="inline-block text-xs tracking-[0.4em] uppercase border"
            style={{
              borderColor: "var(--gold-border)",
              color: "var(--gold)",
              background: "var(--gold-dim)",
              padding: "8px 16px",
              marginBottom: "40px",
            }}
          >
            Deep Learning · TensorFlow · FaceNet512
          </span>
        </div>

        <h1
          className="font-display opacity-0 animate-fade-up delay-2"
          style={{
            fontSize: "clamp(3.2rem, 9vw, 7.5rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            animationFillMode: "forwards",
            maxWidth: "900px",
          }}
        >
          Facial Recognition
          <br />
          <span style={{ color: "var(--gold)" }}>at Scale.</span>
        </h1>

        <p
          className="opacity-0 animate-fade-up delay-3"
          style={{
            color: "var(--text-secondary)",
            animationFillMode: "forwards",
            marginTop: "32px",
            maxWidth: "520px",
            fontSize: "0.9rem",
            lineHeight: 1.8,
          }}
        >
          Enroll faces. Run recognition in milliseconds. Built on FaceNet512
          with 99.6% accuracy on LFW benchmark. Production-ready. Privacy-first.
        </p>

        <div
          className="flex items-center gap-4 opacity-0 animate-fade-up delay-4"
          style={{ animationFillMode: "forwards", marginTop: "48px" }}
        >
          <Link
            href="/sign-up"
            className="text-xs tracking-widest uppercase transition-all duration-300 hover:opacity-90"
            style={{
              background: "var(--gold)",
              color: "var(--void)",
              fontWeight: 500,
              padding: "16px 40px",
            }}
          >
            Start Free
          </Link>
          <Link
            href="#how-it-works"
            className="text-xs tracking-widest uppercase border transition-all duration-300 hover:border-[#bfa27a] hover:text-[#bfa27a]"
            style={{
              borderColor: "var(--gold-border)",
              color: "var(--text-secondary)",
              padding: "16px 40px",
            }}
          >
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-3 opacity-0 animate-fade-up delay-5 border-t"
          style={{
            borderColor: "var(--gold-border)",
            animationFillMode: "forwards",
            marginTop: "80px",
            paddingTop: "48px",
            gap: "48px",
            maxWidth: "640px",
            width: "100%",
          }}
        >
          {[
            { value: "99.6%", label: "LFW Accuracy" },
            { value: "512-d", label: "Embedding Vector" },
            { value: "<200ms", label: "Avg Recognition" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="font-display"
                style={{ fontSize: "2rem", color: "var(--gold)" }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--text-muted)", marginTop: "6px" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{ padding: "120px 32px", maxWidth: "1100px", margin: "0 auto" }}
      >
        <div className="text-center" style={{ marginBottom: "80px" }}>
          <span
            className="text-xs tracking-[0.4em] uppercase"
            style={{ color: "var(--gold)" }}
          >
            Pipeline
          </span>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              color: "var(--text-primary)",
              marginTop: "16px",
            }}
          >
            How It Works
          </h2>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-px"
          style={{ background: "var(--gold-border)" }}
        >
          {[
            {
              step: "01",
              title: "Enroll",
              desc: "Upload a clear photo. FaceNet512 extracts a 512-dimensional embedding vector and stores it securely in your vault.",
            },
            {
              step: "02",
              title: "Recognize",
              desc: "Submit any image for recognition. Cosine distance is computed against all enrolled embeddings in real time.",
            },
            {
              step: "03",
              title: "Audit",
              desc: "Every recognition attempt is logged with confidence score, timestamp, and IP. Full audit trail always available.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex flex-col"
              style={{ background: "var(--surface)", padding: "48px 40px", gap: "24px" }}
            >
              <span
                className="font-display"
                style={{ fontSize: "3.5rem", color: "var(--gold-border)" }}
              >
                {item.step}
              </span>
              <div>
                <h3
                  className="font-display"
                  style={{ fontSize: "1.6rem", color: "var(--gold)", marginBottom: "12px" }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    lineHeight: 1.8,
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech strip */}
      <section
        className="border-t border-b"
        style={{ borderColor: "var(--gold-border)", padding: "48px 32px" }}
      >
        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: "48px", maxWidth: "1100px", margin: "0 auto" }}
        >
          {[
            "TensorFlow 2.17",
            "FaceNet512",
            "FastAPI",
            "Next.js 14",
            "PostgreSQL",
            "Clerk Auth",
            "Cloudinary",
          ].map((tech) => (
            <span
              key={tech}
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative z-10 text-center"
        style={{ padding: "120px 32px" }}
      >
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(2rem, 5vw, 4rem)",
            color: "var(--text-primary)",
          }}
        >
          Ready to build your vault?
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            marginTop: "16px",
          }}
        >
          Free to start. No credit card required.
        </p>
        <Link
          href="/sign-up"
          className="inline-block text-xs tracking-widest uppercase transition-all duration-300 hover:opacity-90"
          style={{
            background: "var(--gold)",
            color: "var(--void)",
            fontWeight: 500,
            padding: "16px 48px",
            marginTop: "40px",
          }}
        >
          Get Started Now
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 border-t flex items-center justify-between"
        style={{
          borderColor: "var(--gold-border)",
          padding: "32px 32px",
        }}
      >
        <span className="font-display text-lg" style={{ color: "var(--gold)" }}>
          FaceVault
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Built with TensorFlow · FaceNet512 · FastAPI · Next.js
        </span>
      </footer>
    </main>
  );
}

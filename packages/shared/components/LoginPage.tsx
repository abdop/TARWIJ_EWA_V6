import { FormEvent, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import useHashConnect from "../../../src/hooks/useHashConnect";

type LoginPageProps = {
  title: string;
  subtitle: string;
  description: string;
  disclaimer: string;
  dashboardPath?: string;
};

export default function LoginPage({
  title,
  subtitle,
  description,
  disclaimer,
  dashboardPath = "/dashboard",
}: LoginPageProps) {
  const router = useRouter();
  const { connect, isLoading, error, isConnected, accountId } = useHashConnect();

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await connect();
  }

  // Redirect if already connected
  if (isConnected && accountId) {
    router.push(dashboardPath);
    return null;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-background-dark flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-background-dark/80 p-8 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-primary">
              {subtitle}
            </p>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-sm text-gray-400">{description}</p>
          </div>

          {error ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleConnect}>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3 text-background-dark font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              <HashpackIcon className="h-5 w-5" />
              {isLoading ? "Connecting to HashPack..." : "Connect with HashPack"}
            </button>
          </form>

          <p className="text-xs text-gray-500">{disclaimer}</p>
        </div>
      </div>
    </>
  );
}

function HashpackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 14.93V18h-2v-1.07a4.008 4.008 0 0 1-3-3.86V7h2v6.07A2 2 0 0 0 13 13V7h2v6.07a4.008 4.008 0 0 1-3 3.86Z" />
    </svg>
  );
}

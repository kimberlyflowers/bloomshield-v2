import Link from 'next/link';

export const metadata = { title: 'Terms of Service | BloomShield' };

export default function TermsPage() {
  return (
    <main className="workspace min-h-screen px-4 py-10">
      <article className="workspace-card mx-auto max-w-3xl space-y-5 p-5 leading-relaxed sm:p-8">
        <Link href="/" className="text-sm text-workspace-accent underline">Back to BloomShield</Link>
        <h1 className="text-3xl font-bold">BloomShield Terms of Service</h1>
        <p className="text-sm text-workspace-muted">Version dated November 7, 2026</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Your account and files</h2>
          <p>Use BloomShield only if you can enter into an agreement under the laws that apply to you. Keep access to your workspace secure. Upload only files you own or have permission to store and timestamp. You retain your rights in your files. You give BloomShield permission to process and store them as needed to provide the service you request.</p>
          <p>Do not upload illegal or infringing material, distribute malware, impersonate others, or attempt to access another workspace. BloomShield may restrict access to address abuse or protect other users.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Timestamps and public records</h2>
          <p>A confirmed Polygon timestamp records a file fingerprint at a point in time. It does not establish authorship, transfer ownership, register copyright, or prevent copying. BloomShield labels a timestamp verified only after it can check it on Polygon. Keep your own copies of important files.</p>
          <p>BloomShield stores your uploaded file in private workspace storage. File fingerprints and related hash metadata may be published on Polygon or IPFS as part of timestamping. Public records can persist even after you delete your account.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Plans, renewal, and cancellation</h2>
          <p>The Free plan includes 3 saved assets per workspace per calendar month. When available, Pro costs $19 USD per month for 30 saved assets and Unlimited costs $49 USD per month for unlimited saved assets. Usage resets on the first day of each month in UTC. Unused capacity does not roll over.</p>
          <p>Paid subscriptions renew monthly until canceled. Review the amount, billing date, and any taxes displayed by Whop before authorizing payment. To stop future charges, cancel in your Whop account before the next renewal. Access generally continues through the paid period, and the Free limit applies afterward.</p>
          <p>Request a refund through Whop’s Resolution Center. Your statutory consumer rights apply.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <a className="text-workspace-accent underline" href="https://docs.whop.com/memberships-and-access/cancellations-and-refunds/cancel-a-subscription">How to cancel in Whop</a>
            <a className="text-workspace-accent underline" href="https://docs.whop.com/memberships-and-access/cancellations-and-refunds/request-a-refund">How to request a refund</a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Deleting your account</h2>
          <p>Cancel any active Whop subscription and allow the paid period to end before deleting your BloomShield account. Use Settings → Advanced to request deletion. Deletion removes your BloomShield sign-in and the private files and records owned by that account. Polygon records and copies of public IPFS metadata can remain available. Whop manages its own account and transaction records.</p>
        </section>
      </article>
    </main>
  );
}

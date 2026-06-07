import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, PlatformShell, StatusPill } from "../_components/platform-shell";
import { formatDate, getPlatformData, humanize, statusPresentation, text } from "@/lib/platform-data";

export default async function TrustPage() {
  const authState = await auth();
  if (!authState.userId) redirect("/sign-in");

  const data = await getPlatformData();

  return (
    <PlatformShell
      active="/trust"
      title="Trust center"
      description="Verification state, evidence, reputation signals, and marketplace readiness for the active organization."
    >
      {!data.organization ? (
        <EmptyState title="No organization context">
          Select or onboard an organization before trust checks can be displayed or requested.
        </EmptyState>
      ) : null}

      <section className="hero-card">
        <div>
          <p className="eyebrow">Marketplace readiness</p>
          <h2>{data.trustLevel.label}</h2>
          <p>{data.trustLevel.reasons.slice(0, 3).join(" ")}</p>
        </div>
        <div className="trust-score-card">
          <strong>{data.trustLevel.score}/100</strong>
          <StatusPill tone={data.trustLevel.tone}>Trust score</StatusPill>
        </div>
      </section>

      <section className="section-grid two-column">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Verification state</p>
              <h2>Organization trust gates</h2>
            </div>
          </div>
          <ul className="stack-list">
            <li>
              <span>Organization status</span>
              <StatusPill tone={statusPresentation(data.organization?.status).tone}>{statusPresentation(data.organization?.status).label}</StatusPill>
            </li>
            <li>
              <span>Verification status</span>
              <StatusPill tone={statusPresentation(data.organization?.verification_status).tone}>{statusPresentation(data.organization?.verification_status).label}</StatusPill>
            </li>
            <li>
              <span>Role profiles</span>
              <strong>{data.roleProfiles.length}</strong>
            </li>
            <li>
              <span>Evidence documents</span>
              <strong>{data.documents.length}</strong>
            </li>
          </ul>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operator pathway</p>
              <h2>Request verification</h2>
            </div>
          </div>
          <form className="stack-form" action="/api/v1/verifications" method="post">
            <label>
              Subject type
              <select name="subjectType" defaultValue="organization">
                <option value="organization">Organization</option>
                <option value="role_profile">Role profile</option>
                <option value="venue">Venue</option>
                <option value="opportunity">Opportunity</option>
                <option value="inventory_unit">Inventory unit</option>
                <option value="document">Document</option>
              </select>
            </label>
            <label>
              Subject ID
              <input name="subjectId" defaultValue={text(data.organization?.id)} placeholder="UUID to verify" />
            </label>
            <label>
              Verification type
              <select name="verificationType" defaultValue="business">
                <option value="business">Business</option>
                <option value="host">Host</option>
                <option value="bidder">Bidder</option>
                <option value="venue">Venue</option>
                <option value="insurance">Insurance</option>
                <option value="license">License</option>
                <option value="attendance">Attendance</option>
              </select>
            </label>
            <label>
              Notes
              <textarea name="notes" placeholder="What evidence should operators review?" />
            </label>
            <button type="submit" disabled={!data.canManageTrust || !data.organization}>
              Request trust review
            </button>
            <p className="form-note">
              {data.canManageTrust ? "Creates a pending verification record for operator review." : "Manager access is required to create verification requests."}
            </p>
          </form>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Trust records</p>
            <h2>Verification queue</h2>
          </div>
          <Link href="/admin">Operator view</Link>
        </div>
        {data.verifications.length ? (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.verifications.map((verification) => (
                  <tr key={text(verification.id)}>
                    <td>{humanize(verification.verification_type)}</td>
                    <td>{humanize(verification.subject_type)}</td>
                    <td><StatusPill tone={statusPresentation(verification.status).tone}>{statusPresentation(verification.status).label}</StatusPill></td>
                    <td>{text(verification.risk_score) || "—"}</td>
                    <td>{formatDate(verification.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No verification records yet">
            Start with business, role-profile, venue, insurance, and attendance checks before exposing strong trust claims.
          </EmptyState>
        )}
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Evidence</p>
            <h2>Documents and proof</h2>
          </div>
        </div>
        {data.documents.length ? (
          <div className="card-list">
            {data.documents.map((document) => (
              <article className="mini-card" key={text(document.id)}>
                <div>
                  <h3>{humanize(document.document_type)}</h3>
                  <p>{text(document.linked_object_type) ? `Linked to ${humanize(document.linked_object_type)}` : "Organization-level evidence"}</p>
                </div>
                <StatusPill tone={statusPresentation(document.status).tone}>{statusPresentation(document.status).label}</StatusPill>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No evidence documents">
            Upload and verify insurance, license, venue proof, event proof, and attendance proof before marking supply as highly trusted.
          </EmptyState>
        )}
      </section>
    </PlatformShell>
  );
}

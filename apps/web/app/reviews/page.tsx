import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EmptyState, PlatformShell, StatusPill } from "../_components/platform-shell";
import { formatDate, getPlatformData, statusPresentation, text } from "@/lib/platform-data";

export default async function ReviewsPage() {
  const authState = await auth();
  if (!authState.userId) redirect("/sign-in");

  const data = await getPlatformData();
  const wouldBookAgain = data.reviewStats.wouldBookAgainRate == null ? "—" : `${Math.round(data.reviewStats.wouldBookAgainRate * 100)}%`;

  return (
    <PlatformShell
      active="/reviews"
      title="Reviews and reputation"
      description="Capture post-booking feedback and display the reputation signals that make the marketplace credible."
    >
      <section className="metric-grid">
        <article className="metric-card">
          <span>Reviews received</span>
          <strong>{data.reviewStats.count}</strong>
          <p>Published and internal review records for this organization.</p>
        </article>
        <article className="metric-card">
          <span>Average rating</span>
          <strong>{data.reviewStats.averageRating ? data.reviewStats.averageRating.toFixed(1) : "—"}</strong>
          <p>Numeric reputation, stored separately from money per D020.</p>
        </article>
        <article className="metric-card">
          <span>Would book again</span>
          <strong>{wouldBookAgain}</strong>
          <p>Repeat-intent signal for marketplace quality.</p>
        </article>
        <article className="metric-card">
          <span>Reviews given</span>
          <strong>{data.reviewsGiven.length}</strong>
          <p>Feedback this organization has submitted after bookings.</p>
        </article>
      </section>

      <section className="section-grid two-column">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Capture</p>
              <h2>Submit booking feedback</h2>
            </div>
          </div>
          <form className="stack-form" action="/api/v1/reviews" method="post">
            <label>
              Booking ID
              <input name="bookingId" placeholder="Booking UUID" />
            </label>
            <label>
              Reviewed organization ID
              <input name="reviewedOrganizationId" placeholder="Host or bidder organization UUID" />
            </label>
            <label>
              Rating
              <select name="rating" defaultValue="5">
                <option value="5">5 — Excellent</option>
                <option value="4">4 — Good</option>
                <option value="3">3 — Acceptable</option>
                <option value="2">2 — Needs improvement</option>
                <option value="1">1 — Poor</option>
              </select>
            </label>
            <label>
              Written feedback
              <textarea name="writtenFeedback" placeholder="How did the booking perform? Include setup, communication, and traffic accuracy." />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" name="wouldBookAgain" value="true" /> Would book again
            </label>
            <button type="submit" disabled={!data.organization}>Submit review</button>
            <p className="form-note">Review capture is scoped to the active organization as reviewer.</p>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Display</p>
              <h2>Reputation summary</h2>
            </div>
          </div>
          <ul className="stack-list">
            <li><span>Trust score contribution</span><strong>{data.trustLevel.score}/100</strong></li>
            <li><span>Review status policy</span><span>Submitted → published or hidden by operators</span></li>
            <li><span>Flagged reviews</span><strong>{data.reviewsReceived.filter((review) => text(review.status) === "flagged").length}</strong></li>
          </ul>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Received feedback</p>
            <h2>Review stream</h2>
          </div>
        </div>
        {data.reviewsReceived.length ? (
          <div className="card-list">
            {data.reviewsReceived.map((review) => (
              <article className="mini-card" key={text(review.id)}>
                <div>
                  <h3>{Number(review.rating).toFixed(1)} stars</h3>
                  <p>{text(review.written_feedback) || "No written feedback captured."}</p>
                  <small>{formatDate(review.created_at)}</small>
                </div>
                <StatusPill tone={statusPresentation(review.status).tone}>{statusPresentation(review.status).label}</StatusPill>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No reviews yet">
            Reviews appear after completed bookings. Until then, trust relies on verification, documents, and operator notes.
          </EmptyState>
        )}
      </section>
    </PlatformShell>
  );
}

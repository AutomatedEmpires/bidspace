import { FIT_LEVEL_LABEL, type FitReport } from "@bidspace/services";
import { Icon, Panel, PanelBody, cn } from "@bidspace/ui";

const LEVEL_CLASS: Record<FitReport["level"], string> = {
  strong: "text-moss dark:text-moss-bright",
  possible: "text-plan dark:text-plan-bright",
  review: "text-signal-deep dark:text-signal-bright",
  blocked: "text-alert dark:text-alert-bright",
};

// Renders the explainable fit report: reasons, not scores.
export function FitPanel({ report, className }: { report: FitReport; className?: string }) {
  const checks = [...report.eligibility, ...report.operational];
  return (
    <Panel className={className}>
      <PanelBody>
        <p className="kicker mb-1">Fit for your business</p>
        <p className={cn("font-display text-xl font-semibold", LEVEL_CLASS[report.level])}>
          {FIT_LEVEL_LABEL[report.level]}
        </p>
        {checks.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {checks.map((check) => (
              <li key={check.key} className="flex items-start gap-2 text-sm">
                <Icon
                  name={check.ok ? "check" : "close"}
                  size={15}
                  className={cn(
                    "mt-0.5 shrink-0",
                    check.ok ? "text-moss dark:text-moss-bright" : "text-alert dark:text-alert-bright",
                  )}
                />
                {check.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted dark:text-canvas-muted">
            No restrictions to check — this opportunity is open to your business.
          </p>
        )}
        {report.attention.length > 0 ? (
          <div className="mt-4 rounded-[3px] border border-signal/30 bg-signal/[0.06] p-3">
            {report.attention.map((note) => (
              <p key={note} className="flex items-start gap-2 text-sm">
                <Icon name="warning" size={15} className="mt-0.5 shrink-0 text-signal" />
                {note}
              </p>
            ))}
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

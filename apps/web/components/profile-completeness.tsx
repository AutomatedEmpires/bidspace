import type { Completeness } from "@bidspace/services";
import { Icon, Panel, PanelBody, cn } from "@bidspace/ui";

// Actionable completeness meter for the vendor business profile. Shows the
// percentage, a progress bar, and the next few things to add — the profile is
// what hosts see in bid review, so nudging completeness is real marketplace value.
export function ProfileCompleteness({ completeness }: { completeness: Completeness }) {
  const { percent, doneCount, total, nextUp } = completeness;
  const complete = percent === 100;

  return (
    <Panel>
      <PanelBody className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="kicker mb-1">Profile strength</p>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {percent}%
              <span className="ml-2 text-sm font-normal text-ink-muted dark:text-canvas-muted">
                {doneCount}/{total} complete
              </span>
            </p>
          </div>
          {complete ? (
            <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-moss/10 px-2.5 py-1 text-sm font-semibold text-moss dark:bg-moss/20 dark:text-moss-bright">
              <Icon name="success" size={16} weight="fill" />
              Strong profile
            </span>
          ) : null}
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.08] dark:bg-canvas/[0.1]"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completeness"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              complete ? "bg-moss dark:bg-moss-bright" : "bg-signal",
            )}
            style={{ width: `${Math.max(percent, 4)}%` }}
          />
        </div>

        {nextUp.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-[13px] font-semibold text-ink dark:text-canvas">Next, add:</p>
            <ul className="grid gap-1.5">
              {nextUp.map((item) => (
                <li key={item.key} className="flex items-start gap-2 text-sm">
                  <Icon
                    name="add"
                    size={15}
                    className="mt-0.5 shrink-0 text-signal"
                  />
                  <span>
                    <span className="font-medium">{item.label}</span>
                    <span className="block text-xs text-ink-muted dark:text-canvas-muted">
                      {item.hint}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-ink-muted dark:text-canvas-muted">
            Your profile gives hosts everything they need to say yes.
          </p>
        )}
      </PanelBody>
    </Panel>
  );
}

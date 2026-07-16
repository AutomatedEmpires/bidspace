import { Icon } from "@bidspace/ui";
import { MARKETPLACE_NOTICE } from "@/lib/marketplace-state";

export function MarketplacePhaseNotice() {
  return (
    <div className="border-b border-plan/25 bg-plan/[0.08] px-4 py-2 text-plan-deep dark:border-plan/35 dark:bg-plan/15 dark:text-plan-bright">
      <p className="mx-auto flex max-w-7xl items-start justify-center gap-2 text-center text-xs font-semibold sm:text-sm">
        <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
        <span>{MARKETPLACE_NOTICE}</span>
      </p>
    </div>
  );
}

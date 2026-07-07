import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  NotFoundError,
  ServiceError,
  getThreadWithContext,
  isThreadParty,
  listMessages,
  sendMessage,
} from "@bidspace/services";
import { Button, EmptyState, Icon, PageHeader, Panel, PanelBody, Textarea, cn } from "@bidspace/ui";
import { requireActiveOrgContext } from "@/lib/org-context";
import { tryGetDb } from "@/lib/safe-db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const context = await requireActiveOrgContext();
  const db = tryGetDb();
  if (!db) return <EmptyState icon="warning" title="Marketplace data is not connected" />;

  const { threadId } = await params;
  let thread;
  try {
    thread = await getThreadWithContext(db, threadId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  if (!isThreadParty(thread, context.activeDbOrganizationId)) notFound();

  const messages = await listMessages(db, threadId);

  async function sendAction(formData: FormData) {
    "use server";
    const current = await requireActiveOrgContext();
    const serverDb = tryGetDb();
    if (!serverDb) return;
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    try {
      const currentThread = await getThreadWithContext(serverDb, threadId);
      if (!isThreadParty(currentThread, current.activeDbOrganizationId)) return;
      await sendMessage(serverDb, {
        threadId,
        senderOrganizationId: current.activeDbOrganizationId,
        senderUserId: current.dbUserId ?? undefined,
        body,
      });
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
    }
    revalidatePath(`/messages/${threadId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={`${thread.context} conversation`}
        title={thread.opportunity?.title ?? "Conversation"}
      />

      <Panel>
        <PanelBody className="grid gap-4">
          {messages.length > 0 ? (
            <ul className="grid gap-3">
              {messages.map((message) => {
                const mine = message.sender_organization_id === context.activeDbOrganizationId;
                return (
                  <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-[6px] px-4 py-2.5 text-sm leading-relaxed",
                        mine
                          ? "bg-ink text-canvas dark:bg-canvas dark:text-ink"
                          : "border border-line bg-canvas dark:bg-ink",
                      )}
                    >
                      <p className="whitespace-pre-line">{message.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          mine ? "text-canvas-muted dark:text-ink-muted" : "text-ink-faint dark:text-canvas-faint",
                        )}
                      >
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted dark:text-canvas-muted">
              No messages yet. Keep it on-platform so the record travels with the booking.
            </p>
          )}

          <form action={sendAction} className="grid gap-2 border-t border-line pt-4">
            <label htmlFor="body" className="sr-only">
              Message
            </label>
            <Textarea id="body" name="body" rows={3} required placeholder="Write a message…" />
            <Button type="submit" variant="primary" size="md" className="justify-self-end">
              <Icon name="send" size={16} />
              Send
            </Button>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}

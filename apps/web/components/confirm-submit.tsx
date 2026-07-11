"use client";

import { Button, type ButtonProps } from "@bidspace/ui";

// A submit button that asks for confirmation before letting the form's server
// action run. Guards irreversible actions (cancel a booking, decline a bid,
// remove a vendor, suspend an org) that previously fired on a single click.
export function ConfirmSubmit({
  confirm,
  children,
  ...props
}: ButtonProps & { confirm: string }) {
  return (
    <Button
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}

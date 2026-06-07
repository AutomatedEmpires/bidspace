"use server";

import { revalidatePath } from "next/cache";
import { requireHostWorkspaceContext } from "@/lib/host-access";
import {
  createEventForHost,
  createInventoryUnitForHost,
  createOpportunityForHost,
  createVenueForHost,
  transitionInventoryUnitForHost,
  transitionOpportunityForHost,
  updateEventForHost,
  updateInventoryUnitForHost,
  updateOpportunityForHost,
  updateVenueForHost,
} from "@/lib/host-supply";

function revalidateHost() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/host");
  revalidatePath("/dashboard/host/venues");
  revalidatePath("/dashboard/host/events");
  revalidatePath("/dashboard/host/opportunities");
  revalidatePath("/dashboard/host/inventory-units");
}

export async function createVenueAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await createVenueForHost(context, formData);
  revalidateHost();
}

export async function updateVenueAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await updateVenueForHost(context, formData);
  revalidateHost();
}

export async function createEventAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await createEventForHost(context, formData);
  revalidateHost();
}

export async function updateEventAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await updateEventForHost(context, formData);
  revalidateHost();
}

export async function createOpportunityAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await createOpportunityForHost(context, formData);
  revalidateHost();
}

export async function updateOpportunityAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await updateOpportunityForHost(context, formData);
  revalidateHost();
}

export async function transitionOpportunityAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await transitionOpportunityForHost(context, formData);
  revalidateHost();
}

export async function createInventoryUnitAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await createInventoryUnitForHost(context, formData);
  revalidateHost();
}

export async function updateInventoryUnitAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await updateInventoryUnitForHost(context, formData);
  revalidateHost();
}

export async function transitionInventoryUnitAction(formData: FormData) {
  const context = await requireHostWorkspaceContext();
  await transitionInventoryUnitForHost(context, formData);
  revalidateHost();
}

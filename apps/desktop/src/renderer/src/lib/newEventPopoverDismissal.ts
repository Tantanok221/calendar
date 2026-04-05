export function shouldDismissNewEventPopover({
  isSubmitting,
  insidePanel,
  insideOwnedPopover
}: {
  isSubmitting: boolean
  insidePanel: boolean
  insideOwnedPopover: boolean
}): boolean {
  return !isSubmitting && !insidePanel && !insideOwnedPopover
}

import { toast as sonnerToast } from "sonner";

// Centralized notification utility. If we ever change the toast library or defaults,
// we only need to do it here.
export const toast = sonnerToast;

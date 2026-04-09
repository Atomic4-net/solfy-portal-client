"use server";

import { sendTicketMessage } from "@/lib/hubspot";
import { revalidatePath } from "next/cache";

export async function sendTicketMessageAction(ticketId: string, message: string) {
  if (!message.trim()) {
    return { error: "El mensaje no puede estar vacío" };
  }

  try {
    await sendTicketMessage(ticketId, message);
    revalidatePath(`/protected/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending message action:", error);
    return { error: "No se ha podido enviar el mensaje. Inténtalo de nuevo." };
  }
}

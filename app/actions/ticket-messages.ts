"use server";

import { sendTicketMessage, uploadFile } from "@/lib/hubspot";
import { revalidatePath } from "next/cache";

export async function sendTicketMessageAction(formData: FormData) {
  const ticketId = formData.get("ticketId") as string;
  const message = formData.get("message") as string;
  const files = formData.getAll("files") as File[];

  if (!message.trim() && files.length === 0) {
    return { error: "El mensaje no puede estar vacío" };
  }

  try {
    const attachmentIds: string[] = [];
    
    // 1. Upload files if any
    for (const file of files) {
      if (file.size > 0) {
        const id = await uploadFile(file);
        attachmentIds.push(id);
      }
    }

    // 2. Send message with attachments
    await sendTicketMessage(ticketId, message, attachmentIds);
    
    revalidatePath(`/protected/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending message action:", error);
    return { error: "No se ha podido enviar el mensaje. Inténtalo de nuevo." };
  }
}
